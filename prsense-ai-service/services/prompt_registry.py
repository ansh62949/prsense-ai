import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("PRSensePromptRegistry")

class PromptRegistry:
    def __init__(self):
        self.prompts = {
            "Security Agent": {
                "v1": "You are an expert Security Agent. Analyze the PR diff for OWASP vulnerabilities, hardcoded secrets, and injection risks.",
                "v2": "You are a Senior Principal Security Auditor. Conduct a threat modeling analysis on this PR diff. Flag SQL injections, hardcoded keys, and directory traversals."
            },
            "Architecture Agent": {
                "v1": "You are an expert Architecture Agent. Analyze the PR diff for SOLID violations, layering alignment, and circular dependencies.",
            },
            "Style Agent": {
                "v1": "You are an expert Style Agent. Analyze the PR diff for naming conventions, formatting, readability, and team standards.",
            },
            "Static Analysis Agent": {
                "v1": "You are an expert Static Analysis Agent. Audit the PR diff and static warnings for complexity, code smells, and anti-patterns."
            },
            "Synthesizer Agent": {
                "v1": "You are a Senior Release Engineer. Summarize the findings of the review agents into a clear executive summary."
            },
            "Performance Agent": {
                "v1": "You are a Performance Tuning Engineer. Inspect the PR diff for memory leaks, slow loops, redundant DB queries, and optimization bottlenecks."
            },
            "Testing Agent": {
                "v1": "You are a QA Automation Lead. Audit the PR diff for missing test files, assertions quality, edge cases coverage, and mock correctness."
            },
            "DevOps Agent": {
                "v1": "You are a DevOps Architect. Audit the PR diff for shell injection vulnerabilities in CI workflow YAMLs, insecure base images in Dockerfiles, and exposed environment variables."
            },
            "Database Agent": {
                "v1": "You are a Principal DBA. Analyze this PR diff for locking migration scripts, unindexed filters, slow JOIN statements, and transaction boundary issues."
            },
            "API Agent": {
                "v1": "You are an API Gateway Architect. Audit the endpoints, path structures, header mappings, and payload parameters for REST consistency and validation safety."
            },
            "Accessibility Agent": {
                "v1": "You are a Frontend Accessibility Auditor. Verify that UI changes contain necessary ARIA attributes, semantic elements, semantic tags, and satisfy contrast requirements."
            },
            "Documentation Agent": {
                "v1": "You are a Technical Writer. Inspect the public functions, controllers, and classes for matching docstrings, Javadocs, and clear usages documentation."
            },
            "Compliance Agent": {
                "v1": "You are a Corporate Compliance Auditor. Audit the codebase for GDPR/CCPA storage leaks, insecure hashing of PII, and copy-pasted license violations."
            }
        }
        self.active_versions = {
            "Security Agent": "v1",
            "Architecture Agent": "v1",
            "Style Agent": "v1",
            "Static Analysis Agent": "v1",
            "Synthesizer Agent": "v1",
            "Performance Agent": "v1",
            "Testing Agent": "v1",
            "DevOps Agent": "v1",
            "Database Agent": "v1",
            "API Agent": "v1",
            "Accessibility Agent": "v1",
            "Documentation Agent": "v1",
            "Compliance Agent": "v1"
        }

    def get_prompt(self, agent_name: str, version: Optional[str] = None) -> str:
        version = version or self.active_versions.get(agent_name, "v1")
        return self.prompts.get(agent_name, {}).get(version, f"You are the expert review agent for: {agent_name}")

    def route_model(self, agent_name: str, risk_level: str = "low") -> str:
        provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        if provider == "gemini":
            if risk_level == "critical" or agent_name == "Security Agent":
                return "gemini-2.5-pro"
            return "gemini-2.5-flash"
        elif provider == "groq":
            return "llama-3.3-70b-versatile"
        else:
            if risk_level == "critical" or agent_name == "Security Agent":
                return "gpt-4o"
            return "gpt-4o-mini"

prompt_registry = PromptRegistry()
