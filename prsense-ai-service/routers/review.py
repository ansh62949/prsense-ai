from fastapi import APIRouter, HTTPException
from models.schemas import ReviewRequest, ReviewResponse
from services.review_service import review_service
import logging

logger = logging.getLogger("PRSenseReviewRouter")
router = APIRouter()

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
        logger.error(f"Review execution failed: {exc}")
        raise HTTPException(status_code=500, detail="Failed to execute PR review workflow.")

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

