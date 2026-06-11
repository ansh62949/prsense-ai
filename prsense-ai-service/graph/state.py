from typing import TypedDict, List, Any, Optional


class PRReviewState(TypedDict, total=False):
    pr_diff: str
    repo_name: Optional[str]
    pr_title: Optional[str]
    findings: List[dict]
    overall_severity: str
    summary: str
    overall_confidence: float
    style_context: str
    rag_context: str
    retrieved_documents: List[dict]
