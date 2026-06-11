import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional

try:
    from langchain_core.messages import HumanMessage
except ImportError:
    try:
        from langchain.schema import HumanMessage
    except ImportError:
        HumanMessage = None

try:
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
except ImportError:
    try:
        from langchain_community.chat_models import ChatOpenAI
        from langchain_community.embeddings import OpenAIEmbeddings
    except ImportError:
        ChatOpenAI = None
        OpenAIEmbeddings = None

try:
    import openai
except ImportError:
    openai = None

try:
    import psycopg2
    from pgvector.psycopg2 import register_vector
except ImportError:
    psycopg2 = None
    register_vector = None

logger = logging.getLogger("PRSenseAgents")
logger.setLevel(logging.INFO)

from services.llm_provider import llm_provider
from services.langfuse_service import langfuse_service
from services.rag_service import rag_service

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = "gpt-4o-mini"
EMBEDDING_MODEL = "text-embedding-3-large"


def _safe_json_load(text: str) -> Any:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass
        return None


def _normalize_severity(value: Optional[str]) -> str:
    if not value:
        return "medium"
    normalized = value.strip().lower()
    if normalized in {"critical", "high", "medium", "low", "info"}:
        return normalized
    if "error" in normalized or "vuln" in normalized:
        return "high"
    if "warn" in normalized:
        return "medium"
    return "medium"


def _normalize_confidence(value: Any) -> float:
    try:
        confidence = float(value)
        if confidence > 1:
            return min(confidence / 100.0, 1.0)
        return max(0.0, min(confidence, 1.0))
    except Exception:
        return 0.75


def _normalize_line_references(refs: Any, default_file: Optional[str]) -> List[dict]:
    normalized = []
    if not isinstance(refs, list):
        if isinstance(refs, dict):
            refs = [refs]
        else:
            return []
            
    for ref in refs:
        if isinstance(ref, dict):
            file_path = ref.get("file_path") or ref.get("file") or default_file or "unknown"
            start_line = ref.get("start_line") or ref.get("line") or ref.get("start")
            end_line = ref.get("end_line") or start_line or ref.get("end")
            note = ref.get("note") or ref.get("comment") or ref.get("description")
            
            try:
                start_line = int(start_line) if start_line is not None else None
            except (ValueError, TypeError):
                start_line = None
                
            try:
                end_line = int(end_line) if end_line is not None else None
            except (ValueError, TypeError):
                end_line = None
                
            normalized.append({
                "file_path": file_path,
                "start_line": start_line,
                "end_line": end_line,
                "note": note
            })
        elif isinstance(ref, (int, float, str)):
            try:
                line_num = int(ref)
                normalized.append({
                    "file_path": default_file or "unknown",
                    "start_line": line_num,
                    "end_line": line_num,
                    "note": "Reference line"
                })
            except (ValueError, TypeError):
                pass
    return normalized


def _parse_finding(item: dict, agent_name: str) -> dict:
    file_path = item.get("file_path") or item.get("file") or item.get("path")
    return {
        "agent": agent_name,
        "category": item.get("category", "general"),
        "severity": _normalize_severity(item.get("severity")),
        "file_path": file_path,
        "line_references": _normalize_line_references(item.get("line_references", []), file_path),
        "recommendation": item.get("recommendation", item.get("fix", "Review the section and improve it.")),
        "confidence": _normalize_confidence(item.get("confidence", item.get("score", 0.78))),
        "description": item.get("description", item.get("issue", "")),
        "why_flagged": item.get("why_flagged") or item.get("why") or "Violates general repository conventions.",
        "rule_violated": item.get("rule_violated") or item.get("rule") or "Standard repository quality guideline.",
        "similar_pr": item.get("similar_pr") or "None identified."
    }


class DocumentLoader:
    @staticmethod
    def load_openapi(spec_json: str) -> str:
        try:
            import json
            spec = json.loads(spec_json)
        except Exception:
            return f"Raw Spec Content:\n{spec_json}"
            
        info = spec.get("info", {})
        md = [f"# API Schema: {info.get('title', 'API Spec')}\nDescription: {info.get('description', 'None')}\n"]
        
        paths = spec.get("paths", {})
        for path, methods in paths.items():
            for method, op in methods.items():
                md.append(f"## {method.upper()} {path}")
                md.append(f"Summary: {op.get('summary', 'No summary')}")
                md.append(f"OperationId: {op.get('operationId', 'None')}")
                
                params = op.get("parameters", [])
                if params:
                    md.append("Parameters:")
                    for p in params:
                        md.append(f"- {p.get('name')} ({p.get('in')}): {p.get('description', 'No desc')} (Required: {p.get('required', False)})")
                
                responses = op.get("responses", {})
                md.append("Responses:")
                for code, resp in responses.items():
                    md.append(f"- {code}: {resp.get('description', 'No desc')}")
                md.append("---")
        return "\n".join(md)


class RecursiveChunker:
    def __init__(self, chunk_size: int = 1500, chunk_overlap: int = 250):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(self, text: str) -> List[str]:
        if len(text) <= self.chunk_size:
            return [text]
            
        lines = text.split("\n")
        chunks = []
        current_chunk = []
        current_len = 0
        
        for line in lines:
            line_len = len(line) + 1
            if current_len + line_len > self.chunk_size and current_chunk:
                chunks.append("\n".join(current_chunk))
                overlap_lines = []
                overlap_len = 0
                for prev in reversed(current_chunk):
                    if overlap_len + len(prev) + 1 < self.chunk_overlap:
                        overlap_lines.insert(0, prev)
                        overlap_len += len(prev) + 1
                    else:
                        break
                current_chunk = overlap_lines
                current_len = overlap_len
                
            current_chunk.append(line)
            current_len += line_len
            
        if current_chunk:
            chunks.append("\n".join(current_chunk))
            
        return [c for c in chunks if c.strip()]


class PRSenseAgent:
    def __init__(self):
        self.llm = llm_provider.get_llm(temperature=0.2)
        self.vector_store = rag_service

    async def learn_from_pr(self, pr_diff: str, pr_title: str, repo_name: Optional[str] = None) -> List[dict]:
        prompt = (
            "You are an expert AI Style Learner Agent for software repositories.\n"
            "Your job is to analyze this MERGED Pull Request and extract coding preferences, naming conventions, preferred patterns, and style rules.\n"
            "Determine what conventions the developers prefer based on this code.\n"
            f"PR Title: {pr_title}\n"
            f"PR Diff:\n{pr_diff}\n\n"
            "Return a JSON array of extracted preferences. Each item MUST be an object containing exactly these fields:\n"
            "- title: a concise title of the style convention (e.g. 'Prefer Early Returns')\n"
            "- description: a clear, descriptive rule explaining the preference\n"
            "- category: one of 'style', 'architecture', or 'naming'\n"
            "- confidence: a float value between 0.0 and 1.0 based on how clearly the pattern is defined in this diff\n"
            "Respond ONLY with the JSON array. Do not include other text or comments."
        )
        
        raw = await self._generate(prompt)
        parsed = _safe_json_load(raw)
        
        if not isinstance(parsed, list):
            logger.error(f"Learn From PR agent failed to extract styles or returned non-list format. Raw response: {raw}")
            return []
            
        stored_patterns = []
        for item in parsed:
            if not isinstance(item, dict):
                continue
            title = item.get("title", "Learned Convention")
            desc = item.get("description", "")
            category = item.get("category", "style")
            try:
                confidence = float(item.get("confidence", 0.85))
            except Exception:
                confidence = 0.85
                
            content = f"Pattern Category: {category}\nConfidence: {confidence}\nDescription: {desc}"
            
            self.vector_store.insert_learned_preference(
                title=title,
                content=content,
                repo_name=repo_name,
                category=category,
                description=desc,
                confidence=confidence
            )
            stored_patterns.append({
                "title": title,
                "description": desc,
                "category": category,
                "confidence": confidence
            })
            
        return stored_patterns

    async def _generate(self, prompt: str, retries: int = 3, initial_delay: float = 1.0) -> str:
        if self.llm is None or HumanMessage is None:
            logger.error("LLM not initialized; returning empty JSON.")
            return "{}"

        messages = [HumanMessage(content=prompt)]
        delay = initial_delay
        for attempt in range(retries + 1):
            try:
                response = await self.llm.ainvoke(messages)
                content = ""
                if hasattr(response, "content"):
                    content = response.content
                else:
                    content = str(response)
                
                if content and content.strip() and content.strip() != "{}":
                    return content
                logger.warning(f"LLM returned empty response or '{{}}' on attempt {attempt + 1}")
            except Exception as exc:
                logger.warning(f"LLM generation failed on attempt {attempt + 1}/{retries + 1}: {exc}")
            
            if attempt < retries:
                logger.info(f"Retrying LLM invoke in {delay}s...")
                await asyncio.sleep(delay)
                delay *= 2.0
                
        return "{}"

    async def _analyze(self, pr_diff: str, agent_name: str, checklist: str, extra_context: str = "") -> List[dict]:
        from services.prompt_registry import prompt_registry
        system_instruction = prompt_registry.get_prompt(agent_name)
        model_name = prompt_registry.route_model(agent_name)
        
        # Route model dynamically if possible
        if self.llm and hasattr(self.llm, "model_name"):
            self.llm.model_name = model_name
            
        prompt = (
            f"System Instruction: {system_instruction}\n"
            f"You are an expert review assistant for GitHub Pull Requests."
            f"\nAgent: {agent_name}\n"
            f"Review the following diff and return a JSON array of findings."
            f" Each finding must include the following fields in JSON format:\n"
            f"- category: standard classification (e.g., security, style, architecture, static_analysis)\n"
            f"- severity: error level (critical, high, medium, low, info)\n"
            f"- file_path: target file path\n"
            f"- line_references: list of objects with file_path, start_line, end_line, note\n"
            f"- recommendation: suggested action/fix\n"
            f"- confidence: float value from 0.0 to 1.0 representing correctness match\n"
            f"- description: clear explanation of the issue\n"
            f"- why_flagged: detailed technical reasoning for flagging this code\n"
            f"- rule_violated: name or rule reference of the architecture/style/security policy violated\n"
            f"- similar_pr: identifier or brief description of a similar historical change (e.g., 'PR-184' or 'None')\n"
            f"\nChecklist:\n{checklist}\n"
            f"\nPR diff:\n{pr_diff}\n"
        )
        if extra_context:
            prompt += f"\nTeam style context:\n{extra_context}\n"

        raw = await self._generate(prompt)
        parsed = _safe_json_load(raw)
        if isinstance(parsed, dict) and parsed.get("findings"):
            parsed = parsed["findings"]
        if not isinstance(parsed, list):
            logger.warning(f"Unexpected agent output for {agent_name}: {raw}")
            return []

        return [_parse_finding(item if isinstance(item, dict) else {}, agent_name) for item in parsed]

    async def run_static_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "static_analysis"
        rag_context = state.get("rag_context", "")
        eng_mem = state.get("engineering_memory", "")
        
        # Run static analysis engine to get pre-run violations
        from services.static_analysis_engine import static_analysis_engine
        static_findings = static_analysis_engine.run_static_checks(state["pr_diff"])
        
        static_ctx = ""
        if static_findings:
            static_ctx = "\nPre-run Static Analysis Violations Detected:\n" + json.dumps(static_findings, indent=2)
            
        extra_ctx = ""
        if rag_context:
            extra_ctx += f"\nRepository RAG Knowledge Context:\n{rag_context}\n"
        if eng_mem:
            extra_ctx += f"\nEngineering Memory (Team Style & Accepted Suggestions):\n{eng_mem}\n"
        if static_ctx:
            extra_ctx += static_ctx
            
        findings = await self._analyze(
            state["pr_diff"],
            "Static Analysis Agent",
            "- code quality\n- complexity\n- maintainability\n- anti-patterns",
            extra_context=extra_ctx
        )
        state.setdefault("findings", []).extend(findings)
        
        # Merge static findings and LLM findings (avoiding duplicates)
        seen_keys = {(f.get("file_path"), f.get("description")) for f in findings}
        for sf in static_findings:
            key = (sf.get("file_path"), sf.get("description"))
            if key not in seen_keys:
                state["findings"].append(sf)
                
        return state

    async def run_security_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "security_analysis"
        rag_context = state.get("rag_context", "")
        eng_mem = state.get("engineering_memory", "")
        extra_ctx = ""
        if rag_context:
            extra_ctx += f"\nRepository RAG Knowledge Context:\n{rag_context}\n"
        if eng_mem:
            extra_ctx += f"\nEngineering Memory (Team Style & Accepted Suggestions):\n{eng_mem}\n"
        findings = await self._analyze(
            state["pr_diff"],
            "Security Agent",
            "- OWASP risks\n- hardcoded secrets\n- unsafe code\n- vulnerabilities",
            extra_context=extra_ctx
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_architecture_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "architecture_analysis"
        rag_context = state.get("rag_context", "")
        eng_mem = state.get("engineering_memory", "")
        extra_ctx = ""
        if rag_context:
            extra_ctx += f"\nRepository RAG Knowledge Context:\n{rag_context}\n"
        if eng_mem:
            extra_ctx += f"\nEngineering Memory (Team Style & Accepted Suggestions):\n{eng_mem}\n"
        findings = await self._analyze(
            state["pr_diff"],
            "Architecture Agent",
            "- SOLID principles\n- layering violations\n- architectural consistency\n- design boundaries",
            extra_context=extra_ctx
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_style_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "style_analysis"
        fallback_context = "Use consistent naming, formatting, readability, and team standards." 
        style_context = self.vector_store.fetch_style_guidelines(
            state["pr_diff"],
            organization_id=state.get("organization_id"),
            commit_sha=state.get("commit_sha")
        ) or fallback_context
        
        rag_context = state.get("rag_context", "")
        eng_mem = state.get("engineering_memory", "")
        
        if rag_context:
            style_context = f"{style_context}\n\nRepository RAG Knowledge Context:\n{rag_context}"
        if eng_mem:
            style_context = f"{style_context}\n\nEngineering Memory (Team Style & Accepted Suggestions):\n{eng_mem}"
            
        state["style_context"] = style_context
        findings = await self._analyze(
            state["pr_diff"],
            "Style Agent",
            "- naming conventions\n- formatting\n- readability\n- team standards",
            extra_context=style_context,
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_performance_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "performance_analysis"
        findings = await self._analyze(
            state["pr_diff"],
            "Performance Agent",
            "- loops, database queries\n- memory leaks, speed bottlenecks\n- algorithmic complexity",
            extra_context=state.get("style_context", "")
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_testing_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "testing_analysis"
        findings = await self._analyze(
            state["pr_diff"],
            "Testing Agent",
            "- assertions quality\n- edge cases, unit tests coverage\n- test configuration files",
            extra_context=state.get("style_context", "")
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_devops_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "devops_analysis"
        findings = await self._analyze(
            state["pr_diff"],
            "DevOps Agent",
            "- Dockerfile base image safety\n- CI workflow secrets injection\n- Kubernetes configurations rules",
            extra_context=state.get("style_context", "")
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_database_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "database_analysis"
        findings = await self._analyze(
            state["pr_diff"],
            "Database Agent",
            "- unindexed searches, slow JOIN queries\n- migration locking statements\n- transaction boundaries safety",
            extra_context=state.get("style_context", "")
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_api_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "api_analysis"
        findings = await self._analyze(
            state["pr_diff"],
            "API Agent",
            "- API gateway parameters validation\n- path structures rest conventions\n- header payload security rules",
            extra_context=state.get("style_context", "")
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_accessibility_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "accessibility_analysis"
        findings = await self._analyze(
            state["pr_diff"],
            "Accessibility Agent",
            "- ARIA attributes usage\n- semantic HTML structures\n- contrast requirements verification",
            extra_context=state.get("style_context", "")
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_documentation_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "documentation_analysis"
        findings = await self._analyze(
            state["pr_diff"],
            "Documentation Agent",
            "- docstrings, Javadocs coverage\n- README updates alignment\n- API docs description matching",
            extra_context=state.get("style_context", "")
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def run_compliance_analysis(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "compliance_analysis"
        findings = await self._analyze(
            state["pr_diff"],
            "Compliance Agent",
            "- GDPR/CCPA storage leaks\n- copy-pasted license violations\n- encryption rules compliance",
            extra_context=state.get("style_context", "")
        )
        state.setdefault("findings", []).extend(findings)
        return state

    async def execute_parallel_review(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "parallel_agent_execution"
        pr_diff = state.get("pr_diff", "")
        
        # Base agents that ALWAYS run
        tasks = [
            self.run_static_analysis(state),
            self.run_security_analysis(state),
            self.run_architecture_analysis(state),
            self.run_style_analysis(state),
        ]
        
        # Dynamic agents based on language / framework / diff content
        if "dockerfile" in pr_diff.lower() or "workflow" in pr_diff.lower() or ".yaml" in pr_diff.lower() or ".yml" in pr_diff.lower():
            logger.info("DevOps changes detected. Scheduling DevOps Agent...")
            tasks.append(self.run_devops_analysis(state))
            
        if "sql" in pr_diff.lower() or "db" in pr_diff.lower() or "migration" in pr_diff.lower() or "repository" in pr_diff.lower():
            logger.info("Database files or SQL queries altered. Scheduling Database Agent...")
            tasks.append(self.run_database_analysis(state))
            
        if "controller" in pr_diff.lower() or "mapping" in pr_diff.lower() or "/api/" in pr_diff.lower() or "@get" in pr_diff.lower() or "@post" in pr_diff.lower():
            logger.info("API Controller routes modified. Scheduling API Agent...")
            tasks.append(self.run_api_analysis(state))
            
        if "test" in pr_diff.lower() or "spec" in pr_diff.lower() or "assert" in pr_diff.lower():
            logger.info("Test coverage modifications. Scheduling Testing Agent...")
            tasks.append(self.run_testing_analysis(state))
            
        if "loop" in pr_diff.lower() or "for " in pr_diff.lower() or "while" in pr_diff.lower() or "thread" in pr_diff.lower() or "performance" in pr_diff.lower():
            logger.info("Loops or multithreading blocks altered. Scheduling Performance Agent...")
            tasks.append(self.run_performance_analysis(state))
            
        if ".jsx" in pr_diff.lower() or ".tsx" in pr_diff.lower() or "html" in pr_diff.lower() or "css" in pr_diff.lower():
            logger.info("UI views or styles changed. Scheduling Accessibility Agent...")
            tasks.append(self.run_accessibility_analysis(state))
            
        if "javadoc" in pr_diff.lower() or "comment" in pr_diff.lower() or "readme" in pr_diff.lower():
            logger.info("Documentation altered. Scheduling Documentation Agent...")
            tasks.append(self.run_documentation_analysis(state))
            
        if "gdpr" in pr_diff.lower() or "license" in pr_diff.lower() or "compliance" in pr_diff.lower() or "personal" in pr_diff.lower() or "auth" in pr_diff.lower():
            logger.info("Auth or legal terms found. Scheduling Compliance Agent...")
            tasks.append(self.run_compliance_analysis(state))
            
        await asyncio.gather(*tasks)
        return state

    async def synthesize_summary(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["current_node"] = "synthesizer"
        findings = state.get("findings", [])
        if not findings:
            state["summary"] = "No actionable findings were discovered in the provided diff."
            state["overall_confidence"] = 0.75
            state["overall_severity"] = "low"
            return state

        summary_prompt = (
            "You are a senior engineering reviewer. Summarize the following PR review findings into a concise review summary."
            " Include an overall severity and an overall confidence score between 0.0 and 1.0."
            f"\nFindings:\n{json.dumps(findings, indent=2)}\n"
        )
        response = await self._generate(summary_prompt)
        if response:
            state["summary"] = response.strip()
        else:
            state["summary"] = "The review was completed, and findings were generated successfully."
        total_confidence = sum(item.get("confidence", 0.75) for item in findings)
        state["overall_confidence"] = round(min(max(total_confidence / max(len(findings), 1), 0.0), 1.0), 2)
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for item in findings:
            severity_counts[item["severity"]] = severity_counts.get(item["severity"], 0) + 1
        if severity_counts["critical"] > 0:
            state["overall_severity"] = "critical"
        elif severity_counts["high"] > 0:
            state["overall_severity"] = "high"
        elif severity_counts["medium"] > 0:
            state["overall_severity"] = "medium"
        else:
            state["overall_severity"] = "low"
        return state

    async def generate_repository_intelligence(
        self,
        repo_name: str,
        readme: Optional[str] = None,
        architecture: Optional[str] = None,
        standards: Optional[str] = None,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> Dict[str, Any]:
        prompt = (
            "You are an expert AI Repository Intelligence Layer.\n"
            "Analyze these inputs from a software repository:\n"
            f"README:\n{readme or 'Not provided'}\n\n"
            f"Architecture docs:\n{architecture or 'Not provided'}\n\n"
            f"Coding standards:\n{standards or 'Not provided'}\n\n"
            "Generate three distinct profiles:\n"
            "1. Repository Profile (core technologies, project layout, main entry points)\n"
            "2. Coding Style Profile (naming rules, conventions, readability guidelines)\n"
            "3. Architecture Profile (design boundaries, patterns used, structural constraints)\n\n"
            "Your output must be a valid JSON object containing exactly three string fields:\n"
            "- repository_profile: descriptive profile text\n"
            "- coding_style_profile: naming and conventions text\n"
            "- architecture_profile: design boundaries and patterns text\n"
            "Respond ONLY with the JSON object. Do not wrap in markdown or add comments."
        )
        
        raw_res = await self._generate(prompt)
        parsed = _safe_json_load(raw_res)
        
        if not isinstance(parsed, dict):
            logger.error(f"Generate Repository Intelligence agent failed to generate a valid response. Raw response: {raw_res}")
            parsed = {
                "repository_profile": readme or f"A software repository named {repo_name}.",
                "coding_style_profile": standards or "Standard clean coding conventions.",
                "architecture_profile": architecture or "Standard software architecture layout."
            }
            
        saved_count = 0
        
        # Save Repository Profile
        chunks1 = self.vector_store.insert_memory_document(
            title=f"{repo_name} Repository Profile",
            content=parsed.get("repository_profile", ""),
            content_type="repo_doc",
            repo_name=repo_name,
            organization_id=organization_id,
            commit_sha=commit_sha
        )
        if chunks1 > 0:
            saved_count += 1
            
        # Save Style Profile
        chunks2 = self.vector_store.insert_memory_document(
            title=f"{repo_name} Style Profile",
            content=parsed.get("coding_style_profile", ""),
            content_type="coding_standard",
            repo_name=repo_name,
            organization_id=organization_id,
            commit_sha=commit_sha
        )
        if chunks2 > 0:
            saved_count += 1
            
        # Save Architecture Profile
        chunks3 = self.vector_store.insert_memory_document(
            title=f"{repo_name} Architecture Profile",
            content=parsed.get("architecture_profile", ""),
            content_type="architecture",
            repo_name=repo_name,
            organization_id=organization_id,
            commit_sha=commit_sha
        )
        if chunks3 > 0:
            saved_count += 1
            
        return {
            "success": saved_count > 0,
            "message": f"Successfully generated and stored {saved_count} profiles in vector store.",
            "profiles_created": saved_count
        }

    async def ask_repository(
        self,
        query: str,
        repo_name: Optional[str] = None,
        top_k: int = 5,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> Dict[str, Any]:
        res = self.vector_store.fetch_relevant_context(
            query=query,
            repo_name=repo_name,
            limit=top_k,
            organization_id=organization_id,
            commit_sha=commit_sha
        )
        context_block = res.get("context_block", "No relevant context found in RAG.")
        docs = res.get("documents", [])
        
        prompt = (
            "You are an AI Repository Copilot named PRSense Ask Agent.\n"
            "Use the retrieved repository documentation below to answer the user's engineering question.\n"
            "You must explain your reasoning and cite the source titles when answering.\n\n"
            f"Retrieved Documents:\n{context_block}\n\n"
            f"Question: {query}\n\n"
            "Return a JSON object containing exactly two string fields:\n"
            "- answer: clear and concise engineering answer with inline citations (e.g. [SOURCE: ...])\n"
            "- reasoning: your step-by-step reasoning explaining why you formulated this answer\n"
            "Respond ONLY with the JSON object. Do not add markdown framing."
        )
        
        raw_res = await self._generate(prompt)
        parsed = _safe_json_load(raw_res)
        
        if not isinstance(parsed, dict) or "answer" not in parsed:
            logger.error(f"Ask Repository agent failed to generate a valid response. Raw response: {raw_res}")
            parsed = {
                "answer": "I am currently unable to query the repository context due to upstream LLM rate limits or service unavailability. Please try again in a few moments.",
                "reasoning": "LLM generation returned empty/invalid response."
            }
            
        return {
            "answer": parsed.get("answer", ""),
            "reasoning": parsed.get("reasoning", ""),
            "retrieved_documents": docs
        }

    async def summarize_repository(
        self,
        repo_name: str,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> Dict[str, Any]:
        # Perform RAG query to retrieve any indexed profiles or standards
        res = self.vector_store.fetch_relevant_context(
            query=f"repository technologies architecture coding conventions for {repo_name}",
            repo_name=repo_name,
            limit=5,
            organization_id=organization_id,
            commit_sha=commit_sha
        )
        context_block = res.get("context_block", "")
        
        prompt = (
            "You are the PRSense Repository Summarizer Agent.\n"
            f"Using the repository name '{repo_name}' and any known profiles, summarize this repository.\n"
            f"Retrieved Context:\n{context_block}\n\n"
            "Provide a high-level summary, list of core technologies, architectural design patterns, and coding conventions.\n"
            "Your output must be a valid JSON object containing exactly these fields:\n"
            "- summary: a clear, executive paragraph overview\n"
            "- technology_stack: array of string names (e.g. ['React', 'Spring Boot', 'PostgreSQL'])\n"
            "- architecture_patterns: array of string patterns (e.g. ['Clean Architecture', 'Layered Architecture'])\n"
            "- coding_conventions: array of style patterns (e.g. ['Prefer early returns', 'CamelCase for variables'])\n"
            "Respond ONLY with the JSON object. Do not wrap in markdown or add comments."
        )
        
        raw_res = await self._generate(prompt)
        parsed = _safe_json_load(raw_res)
        
        if not isinstance(parsed, dict) or "summary" not in parsed:
            logger.error(f"Summarize Repository agent failed to generate a valid response. Raw response: {raw_res}")
            # Infer some basic defaults from repo_name
            tech_stack = ["Git"]
            repo_lower = repo_name.lower()
            if "react" in repo_lower or "frontend" in repo_lower or "js" in repo_lower or "ts" in repo_lower:
                tech_stack.extend(["React", "JavaScript", "CSS"])
            elif "springboot" in repo_lower or "backend" in repo_lower or "java" in repo_lower or "chatserver" in repo_lower:
                tech_stack.extend(["Java", "Spring Boot"])
            elif "python" in repo_lower or "flask" in repo_lower or "fastapi" in repo_lower or "ai" in repo_lower:
                tech_stack.extend(["Python", "FastAPI"])
            
            parsed = {
                "summary": f"A software repository named {repo_name}. Detailed AI summarization is temporarily unavailable due to upstream rate limits, but the repository is indexed and ready for code analysis.",
                "technology_stack": tech_stack,
                "architecture_patterns": ["Layered Architecture" if ("springboot" in repo_lower or "backend" in repo_lower or "chatserver" in repo_lower) else "Standard Layout"],
                "coding_conventions": ["Use standard formatting", "Write clean and readable code"]
            }
            
        return {
            "repo_name": repo_name,
            "summary": parsed.get("summary", ""),
            "technology_stack": parsed.get("technology_stack", []),
            "architecture_patterns": parsed.get("architecture_patterns", []),
            "coding_conventions": parsed.get("coding_conventions", [])
        }


agent_coordinator = PRSenseAgent()
