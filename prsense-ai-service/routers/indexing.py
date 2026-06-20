from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from services.async_task_service import process_index_event
import logging

logger = logging.getLogger("PRSenseIndexingRouter")
router = APIRouter()

class IndexRequest(BaseModel):
    repositoryId: int
    fullName: str
    organizationId: Optional[str] = None
    latestCommitSha: Optional[str] = None

@router.post("/api/index/repository")
async def index_repository(request: IndexRequest, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Direct API request to index repository: {request.fullName} (ID: {request.repositoryId})")
        
        payload = {
            "repo_id": request.repositoryId,
            "repo_full_name": request.fullName,
            "organization_id": request.organizationId,
            "commit_sha": request.latestCommitSha
        }
        
        background_tasks.add_task(process_index_event, payload)
        
        return {
            "success": True,
            "message": "Repository indexing successfully triggered in background."
        }
    except Exception as exc:
        logger.error(f"Failed to queue repository indexing: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
