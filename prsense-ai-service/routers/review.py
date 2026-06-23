from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import ReviewRequest, ReviewResponse, ReviewFinding
from services.review_service import review_service
from services.async_task_service import process_review_event
from pydantic import BaseModel
from typing import Optional
import logging

class DirectReviewRequest(BaseModel):
    review_id: int
    repo_full_name: str
    pr_title: Optional[str] = None
    pr_diff: Optional[str] = None
    organization_id: Optional[str] = None
    commit_sha: Optional[str] = None

logger = logging.getLogger("ReviewController")
router = APIRouter()

@router.post("/api/review/run")
async def run_direct_review(request: DirectReviewRequest, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Direct API request to execute review ID: {request.review_id} for {request.repo_full_name}")
        payload = {
            "review_id": request.review_id,
            "repo_full_name": request.repo_full_name,
            "pr_title": request.pr_title,
            "pr_diff": request.pr_diff,
            "organization_id": request.organization_id,
            "commit_sha": request.commit_sha
        }
        background_tasks.add_task(process_review_event, payload)
        return {
            "success": True,
            "message": "Review execution successfully triggered in background."
        }
    except Exception as exc:
        logger.error(f"Failed to queue review execution: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
from config import sanitize_repo_name

@router.post("/review", response_model=ReviewResponse)
async def review_pr(request: ReviewRequest):
    try:
        sanitized_name = sanitize_repo_name(request.repo_name)
        res = await review_service.execute_review(
            pr_diff=request.pr_diff,
            repo_name=sanitized_name,
            pr_title=request.pr_title,
            review_id=request.review_id,
            organization_id=request.organization_id,
            commit_sha=request.commit_sha
        )
        return ReviewResponse(
            findings=res["findings"],
            overall_severity=res["overall_severity"],
            summary=res["summary"],
            confidence=res["confidence"],
            rag_context=res["rag_context"],
            retrieved_documents=res["retrieved_documents"]
        )
    except Exception as exc:
        logger.error(f"Review PR failed: {exc}")
        return ReviewResponse(
            findings=[
                ReviewFinding(
                    agent="PRSense AI System",
                    category="System Limit",
                    severity="LOW",
                    recommendation="Wait a moment and try review trigger again.",
                    confidence=0.5,
                    description=f"PR review execution failed because the AI service API quota was exhausted or an unexpected error occurred. Details: {exc}"
                )
            ],
            overall_severity="LOW",
            summary=f"PR review was not fully completed because the AI service API quota has been exhausted. Details: {exc}",
            confidence=0.5,
            rag_context="Fallback context: Quota exhausted.",
            retrieved_documents=[]
        )

from pydantic import BaseModel

class PlaygroundRequest(BaseModel):
    code_snippet: str
    language: str

@router.post("/api/review/playground")
async def run_playground_review(request: PlaygroundRequest):
    try:
        import time
        start = time.perf_counter()
        
        # Construct a simulated PR diff for the code snippet
        simulated_diff = f"--- /dev/null\n+++ b/playground_snippet.{request.language}\n@@ -0,0 +1,100 @@\n"
        for line in request.code_snippet.split("\n"):
            simulated_diff += f"+{line}\n"
            
        res = await review_service.execute_review(
            pr_diff=simulated_diff,
            repo_name="playground-simulation",
            pr_title=f"Manual Playground Review ({request.language})"
        )
        
        end = time.perf_counter()
        duration_ms = int((end - start) * 1000)
        
        total_tokens = sum(s.get("token_usage", 0) for s in res.get("timelines", []))
        total_cost = sum(s.get("cost", 0.0) for s in res.get("timelines", []))
        
        return {
            "success": True,
            "findings": res.get("findings", []),
            "overall_severity": res.get("overall_severity", "low"),
            "summary": res.get("summary", ""),
            "confidence": res.get("confidence", 0.85),
            "duration_ms": duration_ms,
            "token_usage": total_tokens,
            "cost": total_cost,
            "timelines": res.get("timelines", [])
        }
    except Exception as exc:
        logger.error(f"Playground review failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Playground review failed: {str(exc)}")

