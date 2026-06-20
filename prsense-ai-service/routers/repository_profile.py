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
        return RepositoryIntelligenceResponse(
            success=False,
            message=f"Failed to generate repository profile because the AI service API quota has been exhausted. Details: {exc}",
            profiles_created=0
        )


@router.get("/api/repository/summary", response_model=RepositorySummaryResponse)
async def get_repository_summary_details(repo_name: str):
    try:
        agent_coordinator.vector_store = rag_service
        sanitized_name = sanitize_repo_name(repo_name)
        
        # 1. Try to fetch summary from cache first (less than 24 hours old)
        cached = rag_service.fetch_cached_summary(sanitized_name, ignore_age=False)
        if cached:
            logger.info(f"Returning cached repository summary for {sanitized_name}")
            return RepositorySummaryResponse(
                repo_name=sanitized_name,
                summary=cached["summary"],
                technology_stack=cached["technology_stack"],
                architecture_patterns=cached["architecture_patterns"],
                coding_conventions=cached["coding_conventions"]
            )
            
        # 2. If missing or expired, attempt to generate via LLM
        try:
            logger.info(f"Generating new summary for {sanitized_name} via LLM")
            res = await agent_coordinator.summarize_repository(repo_name=sanitized_name)
            
            # 3. If LLM call succeeds, update database cache and return
            rag_service.save_cached_summary(sanitized_name, res)
            return RepositorySummaryResponse(
                repo_name=res["repo_name"],
                summary=res["summary"],
                technology_stack=res["technology_stack"],
                architecture_patterns=res["architecture_patterns"],
                coding_conventions=res["coding_conventions"]
            )
        except Exception as exc:
            logger.warning(f"Failed to generate repository summary via LLM for {sanitized_name}: {exc}")
            
            # 4. If LLM call fails, search for an expired cached summary to use as fallback
            cached_fallback = rag_service.fetch_cached_summary(sanitized_name, ignore_age=True)
            if cached_fallback:
                logger.info(f"Returning expired cached summary as fallback for {sanitized_name}")
                return RepositorySummaryResponse(
                    repo_name=sanitized_name,
                    summary=cached_fallback["summary"],
                    technology_stack=cached_fallback["technology_stack"],
                    architecture_patterns=cached_fallback["architecture_patterns"],
                    coding_conventions=cached_fallback["coding_conventions"]
                )
                
            # 5. If no cached summary exists, return a friendly fallback message
            logger.warning(f"No cached summary available for fallback, returning friendly error message for {sanitized_name}")
            return RepositorySummaryResponse(
                repo_name=sanitized_name,
                summary=f"Repository summary is temporarily unavailable because the AI service API quota has been exhausted. Please try again later. Details: {exc}",
                technology_stack=["Quota Exceeded"],
                architecture_patterns=["Quota Exceeded"],
                coding_conventions=["Quota Exceeded"]
            )
    except Exception as exc:
        logger.error(f"Summarize Repository router endpoint failed unexpectedly: {exc}")
        # Always return a valid response instead of failing with 500
        return RepositorySummaryResponse(
            repo_name=repo_name,
            summary=f"Repository summary generation failed due to an unexpected error. Details: {exc}",
            technology_stack=["Error"],
            architecture_patterns=["Error"],
            coding_conventions=["Error"]
        )

