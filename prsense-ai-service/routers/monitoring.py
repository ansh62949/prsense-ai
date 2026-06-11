from datetime import datetime
from fastapi import APIRouter
from services.rag_service import rag_service
from services.llm_provider import llm_provider

router = APIRouter()

@router.get("/api/monitoring/engine-stats")
async def get_engine_stats():
    return {
        "engine_name": "PRSense AI Engine",
        "version": "1.0.0",
        "llm_model": llm_provider.llm_model,
        "embedding_model": llm_provider.embedding_model,
        "database_connected": rag_service.enabled,
        "timestamp": datetime.utcnow().isoformat()
    }
