import logging
from typing import List, Optional
from services.llm_provider import llm_provider

logger = logging.getLogger("EmbeddingService")

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
            vec = embeddings.embed_query(text)
            if vec is not None:
                # Force dimensions to exactly 1536 to prevent pgvector dimension mismatch
                if len(vec) > 1536:
                    vec = vec[:1536]
                elif len(vec) < 1536:
                    vec = vec + [0.0] * (1536 - len(vec))
            return vec
        except Exception as exc:
            logger.warning(f"Embedding generation failed: {exc}")
            return None

    def embed_texts(self, texts: List[str]) -> List[Optional[List[float]]]:
        embeddings = llm_provider.get_embeddings()
        if not embeddings:
            logger.warning("Embeddings client not available from LLM provider.")
            return [None] * len(texts)
        
        try:
            vecs = embeddings.embed_documents(texts)
            processed_vecs = []
            for vec in vecs:
                if vec is not None:
                    if len(vec) > 1536:
                        vec = vec[:1536]
                    elif len(vec) < 1536:
                        vec = vec + [0.0] * (1536 - len(vec))
                processed_vecs.append(vec)
            return processed_vecs
        except Exception as exc:
            logger.warning(f"Batch embedding generation failed: {exc}")
            return [None] * len(texts)

embedding_service = EmbeddingService()
