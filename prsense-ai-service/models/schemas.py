from typing import List, Optional
from pydantic import BaseModel, Field


class LineReference(BaseModel):
    file_path: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    note: Optional[str] = None


class ReviewFinding(BaseModel):
    agent: str
    category: str
    severity: str
    file_path: Optional[str] = None
    line_references: List[LineReference] = Field(default_factory=list)
    recommendation: str
    confidence: float = Field(ge=0.0, le=1.0)
    description: Optional[str] = None
    why_flagged: Optional[str] = None
    rule_violated: Optional[str] = None
    similar_pr: Optional[str] = None


class ReviewRequest(BaseModel):
    pr_diff: str
    repo_name: Optional[str] = None
    pr_title: Optional[str] = None
    review_id: Optional[int] = None
    organization_id: Optional[str] = None
    commit_sha: Optional[str] = None


class ReviewResponse(BaseModel):
    findings: List[ReviewFinding]
    overall_severity: str
    summary: str
    confidence: float = Field(ge=0.0, le=1.0)
    rag_context: Optional[str] = None
    retrieved_documents: List[dict] = Field(default_factory=list)


class GuidelineRequest(BaseModel):
    guideline_text: str
    source_file: Optional[str] = "manual"
    organization_id: Optional[str] = None
    commit_sha: Optional[str] = None


class GuidelineResponse(BaseModel):
    success: bool
    message: str


class RAGIngestRequest(BaseModel):
    title: str
    content: str
    content_type: str  # 'coding_standard', 'architecture', 'previous_pr', 'review_finding', 'team_convention', 'repo_doc'
    repo_name: Optional[str] = None
    organization_id: Optional[str] = None
    commit_sha: Optional[str] = None


class RAGIngestResponse(BaseModel):
    success: bool
    message: str
    chunks_created: int


class RAGSearchRequest(BaseModel):
    query: str
    repo_name: Optional[str] = None
    content_type: Optional[str] = None
    top_k: Optional[int] = 5
    organization_id: Optional[str] = None
    commit_sha: Optional[str] = None


class RAGSearchResultDoc(BaseModel):
    id: int
    title: str
    content: str
    content_type: str
    repo_name: Optional[str] = None
    score: float
    created_at: str


class RAGSearchResponse(BaseModel):
    query: str
    context_block: str
    retrieved_count: int
    documents: List[RAGSearchResultDoc]


class LearnerRequest(BaseModel):
    pr_diff: str
    pr_title: Optional[str] = "Merged Pull Request"
    repo_name: Optional[str] = None


class LearnerPattern(BaseModel):
    title: str
    description: str
    category: str
    confidence: float = Field(ge=0.0, le=1.0)


class LearnerResponse(BaseModel):
    success: bool
    message: str
    patterns: List[LearnerPattern]


class RepositoryIntelligenceRequest(BaseModel):
    repo_name: str
    readme_content: Optional[str] = None
    architecture_content: Optional[str] = None
    standards_content: Optional[str] = None


class RepositoryIntelligenceResponse(BaseModel):
    success: bool
    message: str
    profiles_created: int


class AskRepositoryRequest(BaseModel):
    query: str
    repo_name: Optional[str] = None
    top_k: Optional[int] = 5
    organization_id: Optional[str] = None
    commit_sha: Optional[str] = None


class AskRepositoryResponse(BaseModel):
    answer: str
    reasoning: str
    retrieved_documents: List[dict] = Field(default_factory=list)


class RepositorySummaryResponse(BaseModel):
    repo_name: str
    summary: str
    technology_stack: List[str] = Field(default_factory=list)
    architecture_patterns: List[str] = Field(default_factory=list)
    coding_conventions: List[str] = Field(default_factory=list)
