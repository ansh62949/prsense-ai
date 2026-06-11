from fastapi import APIRouter, HTTPException
from models.schemas import (
    RepositoryIntelligenceRequest,
    RepositoryIntelligenceResponse,
    RepositorySummaryResponse
)
from services.rag_service import rag_service
from graph.nodes import agent_coordinator
import logging

logger = logging.getLogger("PRSenseRepositoryProfileRouter")
router = APIRouter()

from config import sanitize_repo_name

@router.post("/api/repository/profile", response_model=RepositoryIntelligenceResponse)
async def generate_repository_profile(request: RepositoryIntelligenceRequest):
    try:
        agent_coordinator.vector_store = rag_service
        sanitized_name = sanitize_repo_name(request.repo_name)
        res = await agent_coordinator.generate_repository_intelligence(
            repo_name=sanitized_name,
            readme=request.readme_content,
            architecture=request.architecture_content,
            standards=request.standards_content
        )
        return RepositoryIntelligenceResponse(
            success=res["success"],
            message=res["message"],
            profiles_created=res["profiles_created"]
        )
    except Exception as exc:
        logger.error(f"Failed to generate repository profile: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/repository/summary", response_model=RepositorySummaryResponse)
async def get_repository_summary_details(repo_name: str):
    try:
        agent_coordinator.vector_store = rag_service
        sanitized_name = sanitize_repo_name(repo_name)
        res = await agent_coordinator.summarize_repository(repo_name=sanitized_name)
        return RepositorySummaryResponse(
            repo_name=res["repo_name"],
            summary=res["summary"],
            technology_stack=res["technology_stack"],
            architecture_patterns=res["architecture_patterns"],
            coding_conventions=res["coding_conventions"]
        )
    except Exception as exc:
        logger.error(f"Summarize Repository failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

