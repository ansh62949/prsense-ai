import logging
from typing import Dict, Any, Optional
from services.langgraph_service import langgraph_service

logger = logging.getLogger("ReviewService")

class ReviewService:
    def __init__(self):
        pass

    async def execute_review(
        self,
        pr_diff: str,
        repo_name: str,
        pr_title: str,
        review_id: Optional[int] = None,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> Dict[str, Any]:
        logger.info(f"Starting execution of code review for repository: {repo_name}")
        return await langgraph_service.run_review(
            pr_diff=pr_diff,
            repo_name=repo_name,
            pr_title=pr_title,
            review_id=review_id,
            organization_id=organization_id,
            commit_sha=commit_sha
        )

review_service = ReviewService()
