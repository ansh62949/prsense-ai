import time
import json
import logging
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from services.rag_service import rag_service
from services.langfuse_service import langfuse_service
from services.llm_provider import llm_provider
from graph.nodes import PRSenseAgent

logger = logging.getLogger("WorkflowService")

class TelemetryPRSenseAgent(PRSenseAgent):
    def __init__(self):
        super().__init__()
        self.telemetry_logs = []
        self.agent_outputs_logs = []
        self.current_step_name = "LLM Generation"
        self.vector_store = rag_service
        self.active_trace = None

    async def _analyze(self, pr_diff: str, agent_name: str, checklist: str, extra_context: str = "") -> List[dict]:
        self.current_step_name = agent_name
        return await super()._analyze(pr_diff, agent_name, checklist, extra_context)

    async def _generate(self, prompt: str) -> str:
        step_name = self.current_step_name
        start_time = time.perf_counter()
        
        # Start Langfuse span
        span = None
        if self.active_trace:
            try:
                span = self.active_trace.span(name=step_name, input=prompt)
            except Exception as e:
                logger.warning(f"Failed to create span in Langfuse: {e}")
        
        response = await super()._generate(prompt)
        
        end_time = time.perf_counter()
        duration_ms = int((end_time - start_time) * 1000)
        
        tokens_in = len(prompt) // 4
        tokens_out = len(response) // 4
        cost = (tokens_in * 0.15 + tokens_out * 0.60) / 1_000_000
        
        self.telemetry_logs.append({
            "step_name": step_name,
            "duration_ms": duration_ms,
            "token_usage": tokens_in + tokens_out,
            "cost": cost,
            "status": "COMPLETED"
        })

        # Log generation details to Langfuse
        if span:
            try:
                langfuse_service.log_generation(
                    trace_or_span=span,
                    name=step_name,
                    prompt=prompt,
                    completion=response,
                    model=llm_provider.llm_model,
                    tokens_in=tokens_in,
                    tokens_out=tokens_out,
                    cost=cost,
                    duration_ms=duration_ms
                )
                span.end()
            except Exception as e:
                logger.warning(f"Failed to end/log span: {e}")
        else:
            langfuse_service.log_generation(
                trace_or_span=None,
                name=step_name,
                prompt=prompt,
                completion=response,
                model="gpt-4o-mini",
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                cost=cost,
                duration_ms=duration_ms
            )

        # Estimate confidence
        confidence = 0.85
        from graph.nodes import _safe_json_load
        try:
            parsed = _safe_json_load(response)
            if isinstance(parsed, dict) and "confidence" in parsed:
                confidence = float(parsed["confidence"])
            elif isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict) and "confidence" in parsed[0]:
                confidence = float(parsed[0]["confidence"])
        except Exception:
            pass

        self.agent_outputs_logs.append({
            "agent_name": step_name,
            "prompt": prompt,
            "response": response,
            "confidence": confidence,
            "token_usage": tokens_in + tokens_out,
            "cost": cost,
            "duration_ms": duration_ms
        })
        return response


class LangGraphService:
    def __init__(self):
        pass

    def _compile_graph(self, agent: TelemetryPRSenseAgent):
        workflow = StateGraph(dict)
        
        async def node_prepare(state: Dict) -> Dict:
            start_time = time.perf_counter()
            state["findings"] = []
            state["current_node"] = "prepare_pr"
            state["overall_severity"] = "low"
            state["overall_confidence"] = 0.0
            state["summary"] = ""
            
            # Retrieve repository-specific RAG context
            query = (state.get("pr_title") or "") + "\n" + (state.get("pr_diff") or "")
            repo_name = state.get("repo_name")
            org_id = state.get("organization_id")
            commit_sha = state.get("commit_sha")
            
            res = agent.vector_store.fetch_relevant_context(
                query,
                repo_name=repo_name,
                limit=5,
                organization_id=org_id,
                commit_sha=commit_sha
            )
            state["rag_context"] = res.get("context_block", "")
            state["retrieved_documents"] = res.get("documents", [])
            
            # Fetch engineering memory conventions
            from services.engineering_memory import engineering_memory
            eng_mem = engineering_memory.fetch_memory_context(
                repo_name=repo_name,
                organization_id=org_id
            )
            state["engineering_memory"] = eng_mem
            
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            agent.telemetry_logs.append({
                "step_name": "RAG Context Retrieval",
                "duration_ms": duration_ms,
                "token_usage": 0,
                "cost": 0.0,
                "status": "COMPLETED"
            })
            return state

        async def node_merge_findings(state: Dict) -> Dict:
            start_time = time.perf_counter()
            state["current_node"] = "merge_findings"
            findings = state.get("findings", [])
            unique_findings = []
            seen = set()
            for item in findings:
                key = (item.get("agent"), item.get("file_path"), item.get("recommendation"))
                if key not in seen:
                    seen.add(key)
                    unique_findings.append(item)
            state["findings"] = unique_findings
            
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            agent.telemetry_logs.append({
                "step_name": "Merge Findings",
                "duration_ms": duration_ms,
                "token_usage": 0,
                "cost": 0.0,
                "status": "COMPLETED"
            })
            return state

        async def node_synthesize_summary(state: Dict) -> Dict:
            agent.current_step_name = "Synthesizer Agent"
            return await agent.synthesize_summary(state)

        workflow.add_node("prepare_pr", node_prepare)
        workflow.add_node("execute_agents", agent.execute_parallel_review)
        workflow.add_node("merge_findings", node_merge_findings)
        workflow.add_node("synthesize_summary", node_synthesize_summary)

        workflow.add_edge("prepare_pr", "execute_agents")
        workflow.add_edge("execute_agents", "merge_findings")
        workflow.add_edge("merge_findings", "synthesize_summary")
        workflow.add_edge("synthesize_summary", END)

        workflow.set_entry_point("prepare_pr")
        return workflow.compile()

    async def run_review(
        self,
        pr_diff: str,
        repo_name: str,
        pr_title: str,
        review_id: Optional[int] = None,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> Dict[str, Any]:
        agent = TelemetryPRSenseAgent()
        
        # Start Langfuse trace
        trace_id = f"review-{review_id}" if review_id else f"review-temp-{int(time.time())}"
        agent.active_trace = langfuse_service.start_trace(
            trace_id=trace_id,
            name="PR Code Review Pipeline",
            metadata={
                "repository": repo_name,
                "pr_title": pr_title,
                "organization_id": organization_id,
                "commit_sha": commit_sha
            }
        )

        graph = self._compile_graph(agent)
        
        initial_state = {
            "pr_diff": pr_diff,
            "repo_name": repo_name or "",
            "pr_title": pr_title or "",
            "organization_id": organization_id,
            "commit_sha": commit_sha
        }
        
        try:
            final_state = await graph.ainvoke(initial_state)
            
            # End Langfuse trace
            if agent.active_trace:
                try:
                    agent.active_trace.update(
                        output=final_state.get("summary", ""),
                        metadata={"overall_severity": final_state.get("overall_severity", "low")}
                    )
                except Exception as e:
                    logger.warning(f"Failed to end Langfuse trace: {e}")

            return {
                "findings": final_state.get("findings", []),
                "overall_severity": final_state.get("overall_severity", "low"),
                "summary": final_state.get("summary", ""),
                "confidence": final_state.get("overall_confidence", 0.0),
                "rag_context": final_state.get("rag_context", ""),
                "retrieved_documents": final_state.get("retrieved_documents", []),
                "timelines": agent.telemetry_logs,
                "agent_outputs": agent.agent_outputs_logs
            }
        except Exception as exc:
            logger.error(f"Error during LangGraph review execution: {exc}")
            
            if agent.active_trace:
                try:
                    agent.active_trace.update(
                        output=f"Error: {str(exc)}",
                        metadata={"status": "FAILED"}
                    )
                except Exception as e:
                    logger.warning(f"Failed to log error to Langfuse trace: {e}")

            agent.telemetry_logs.append({
                "step_name": "LangGraph Execution",
                "duration_ms": 0,
                "token_usage": 0,
                "cost": 0.0,
                "status": "FAILED"
            })
            raise exc

langgraph_service = LangGraphService()
