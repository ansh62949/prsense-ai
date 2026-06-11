import logging
from typing import List, Optional
from services.rag_service import rag_service
from graph.nodes import PRSenseAgent

logger = logging.getLogger("PRSenseLearnerService")

class LearnerService:
    def __init__(self):
        self.agent = PRSenseAgent()
        self.agent.vector_store = rag_service

    async def learn_style_patterns(self, pr_diff: str, pr_title: str, repo_name: Optional[str]) -> List[dict]:
        logger.info(f"Extracting style preferences for repository: {repo_name}")
        return await self.agent.learn_from_pr(
            pr_diff=pr_diff,
            pr_title=pr_title or "Merged Pull Request",
            repo_name=repo_name
        )

learner_service = LearnerService()
