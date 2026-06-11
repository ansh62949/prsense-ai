import logging
from typing import List, Optional
from services.llm_provider import llm_provider

logger = logging.getLogger("PRSenseEmbeddingService")

class EmbeddingService:
    def __init__(self):
        self.enabled = True
        logger.info("EmbeddingService initialized successfully using dynamic LLM provider")

    def embed_text(self, text: str) -> Optional[List[float]]:
        embeddings = llm_provider.get_embeddings()
        if not embeddings:
            logger.warning("Embeddings client not available from LLM provider.")
            return None
        
        try:
            return embeddings.embed_query(text)
        except Exception as exc:
            logger.warning(f"Embedding generation failed: {exc}")
            return None

embedding_service = EmbeddingService()
