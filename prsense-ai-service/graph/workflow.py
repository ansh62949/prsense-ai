from typing import Dict
from langgraph.graph import StateGraph, END
from models.schemas import ReviewRequest
from graph.nodes import agent_coordinator


class PRReviewWorkflow:
    def __init__(self):
        self.graph = self._compile_graph()

    def _compile_graph(self):
        workflow = StateGraph(dict)
        workflow.add_node("prepare_pr", self._node_prepare)
        workflow.add_node("execute_agents", agent_coordinator.execute_parallel_review)
        workflow.add_node("merge_findings", self._node_merge_findings)
        workflow.add_node("synthesize_summary", agent_coordinator.synthesize_summary)

        workflow.add_edge("prepare_pr", "execute_agents")
        workflow.add_edge("execute_agents", "merge_findings")
        workflow.add_edge("merge_findings", "synthesize_summary")
        workflow.add_edge("synthesize_summary", END)

        workflow.set_entry_point("prepare_pr")
        return workflow.compile()

    async def _node_prepare(self, state: Dict) -> Dict:
        state["findings"] = []
        state["current_node"] = "prepare_pr"
        state["overall_severity"] = "low"
        state["overall_confidence"] = 0.0
        state["summary"] = ""
        
        # Retrieve repository-specific RAG context
        query = (state.get("pr_title") or "") + "\n" + (state.get("pr_diff") or "")
        repo_name = state.get("repo_name")
        
        res = agent_coordinator.vector_store.fetch_relevant_context(query, repo_name=repo_name, limit=5)
        state["rag_context"] = res.get("context_block", "")
        state["retrieved_documents"] = res.get("documents", [])
        
        return state

    async def _node_merge_findings(self, state: Dict) -> Dict:
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
        return state

    async def run(self, request: ReviewRequest) -> Dict:
        initial_state = {
            "pr_diff": request.pr_diff,
            "repo_name": request.repo_name or "",
            "pr_title": request.pr_title or "",
        }
        final_state = await self.graph.ainvoke(initial_state)
        return {
            "findings": final_state.get("findings", []),
            "overall_severity": final_state.get("overall_severity", "low"),
            "summary": final_state.get("summary", ""),
            "confidence": final_state.get("overall_confidence", 0.0),
            "rag_context": final_state.get("rag_context", ""),
            "retrieved_documents": final_state.get("retrieved_documents", []),
        }
