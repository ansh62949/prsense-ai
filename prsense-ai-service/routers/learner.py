import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import (
    GuidelineRequest,
    GuidelineResponse,
    LearnerRequest,
    LearnerResponse,
    LearnerPattern
)
from services.rag_service import rag_service
from services.learner_service import learner_service
from services.async_task_service import process_learner_event
from pydantic import BaseModel
from typing import Optional

class DirectLearnerRequest(BaseModel):
    repo_full_name: str
    pr_title: Optional[str] = None
    pr_diff: Optional[str] = None
    organization_id: Optional[str] = None

logger = logging.getLogger("LearnerController")
router = APIRouter()

@router.post("/api/learner/run")
async def run_direct_learner(request: DirectLearnerRequest, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Direct API request to execute learner for repo {request.repo_full_name}")
        payload = {
            "repo_full_name": request.repo_full_name,
            "pr_title": request.pr_title,
            "pr_diff": request.pr_diff,
            "organization_id": request.organization_id
        }
        background_tasks.add_task(process_learner_event, payload)
        return {
            "success": True,
            "message": "Learner task successfully triggered in background."
        }
    except Exception as exc:
        logger.error(f"Failed to queue learner execution: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

from config import sanitize_repo_name

@router.post("/guidelines", response_model=GuidelineResponse)
async def add_guideline(request: GuidelineRequest):
    try:
        if not rag_service.enabled:
            raise HTTPException(
                status_code=400,
                detail="Vector database is not enabled or not connected."
            )
        
        success = rag_service.insert_style_guideline(
            guideline_text=request.guideline_text,
            source_file=request.source_file or "manual",
            organization_id=request.organization_id,
            commit_sha=request.commit_sha
        )
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate embedding or save the style guideline."
            )
            
        return GuidelineResponse(
            success=True,
            message="Style guideline successfully embedded and stored."
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to add style guideline: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/learner/learn", response_model=LearnerResponse)
async def learn_style_patterns(request: LearnerRequest):
    try:
        sanitized_name = sanitize_repo_name(request.repo_name)
        patterns = await learner_service.learn_style_patterns(
            pr_diff=request.pr_diff,
            pr_title=request.pr_title or "Merged Pull Request",
            repo_name=sanitized_name
        )
        
        response_patterns = []
        for p in patterns:
            response_patterns.append(LearnerPattern(
                title=p["title"],
                description=p["description"],
                category=p["category"],
                confidence=p["confidence"]
            ))
            
        return LearnerResponse(
            success=True,
            message=f"Successfully extracted and saved {len(response_patterns)} repository preferences.",
            patterns=response_patterns
        )
    except Exception as exc:
        logger.error(f"Learning execution failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/learner/patterns")
async def get_learned_patterns(repo_name: str = None):
    try:
        sanitized_name = sanitize_repo_name(repo_name) if repo_name else None
        patterns = rag_service.fetch_learned_patterns(repo_name=sanitized_name)
        return patterns
    except Exception as exc:
        logger.error(f"Failed to fetch learned patterns: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
