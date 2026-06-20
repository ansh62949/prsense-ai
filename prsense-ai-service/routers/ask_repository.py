from datetime import datetime
import logging
from fastapi import APIRouter, HTTPException
from models.schemas import (
    RAGIngestRequest,
    RAGIngestResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    AskRepositoryRequest,
    AskRepositoryResponse,
    RAGSearchResultDoc
)
from services.rag_service import rag_service
from graph.nodes import agent_coordinator

logger = logging.getLogger("PRSenseAskRepositoryRouter")
router = APIRouter()

from config import sanitize_repo_name

@router.post("/api/rag/ingest", response_model=RAGIngestResponse)
async def ingest_document(request: RAGIngestRequest):
    try:
        if not rag_service.enabled:
            raise HTTPException(
                status_code=400,
                detail="Vector database is not enabled or not connected."
            )
            
        sanitized_name = sanitize_repo_name(request.repo_name)
        chunks_created = rag_service.insert_memory_document(
            title=request.title,
            content=request.content,
            content_type=request.content_type,
            repo_name=sanitized_name,
            organization_id=request.organization_id,
            commit_sha=request.commit_sha
        )
        
        if chunks_created == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to chunk, embed, or save the document."
            )
            
        return RAGIngestResponse(
            success=True,
            message=f"Document '{request.title}' successfully ingested, embedded, and stored in pgvector.",
            chunks_created=chunks_created
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Ingestion failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/rag/search", response_model=RAGSearchResponse)
async def search_rag(request: RAGSearchRequest):
    try:
        if not rag_service.enabled:
            raise HTTPException(
                status_code=400,
                detail="Vector database is not enabled or not connected."
            )
            
        sanitized_name = sanitize_repo_name(request.repo_name)
        res = rag_service.fetch_relevant_context(
            query=request.query,
            repo_name=sanitized_name,
            content_type=request.content_type,
            limit=request.top_k or 5,
            organization_id=request.organization_id,
            commit_sha=request.commit_sha
        )
        
        docs = []
        for d in res.get("documents", []):
            docs.append(RAGSearchResultDoc(
                id=d["id"],
                title=d["title"],
                content=d["content"],
                content_type=d["content_type"],
                repo_name=d["repo_name"],
                score=d["score"],
                created_at=d["created_at"]
            ))
            
        return RAGSearchResponse(
            query=request.query,
            context_block=res.get("context_block", ""),
            retrieved_count=len(docs),
            documents=docs
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"RAG search failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/rag/knowledge-base-stats")
async def get_kb_stats(repo_name: str = None):
    try:
        sanitized_name = sanitize_repo_name(repo_name) if repo_name else None
        stats = rag_service.get_memory_stats(repo_name=sanitized_name)
        return {
            "status": "active" if rag_service.enabled else "offline",
            "total_documents": stats.get("total_documents", 0),
            "document_counts": stats.get("document_counts", {}),
            "is_database_connected": rag_service.enabled,
            "indexing_method": "pgvector_hnsw",
            "embeddings_dimension": 1536,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as exc:
        logger.error(f"Failed to fetch stats: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/repository/ask", response_model=AskRepositoryResponse)
async def ask_repository_copilot(request: AskRepositoryRequest):
    try:
        # Ensure coordinator points to modular vector store
        agent_coordinator.vector_store = rag_service
        sanitized_name = sanitize_repo_name(request.repo_name)
        res = await agent_coordinator.ask_repository(
            query=request.query,
            repo_name=sanitized_name,
            top_k=request.top_k or 5,
            organization_id=request.organization_id,
            commit_sha=request.commit_sha
        )
        return AskRepositoryResponse(
            answer=res["answer"],
            reasoning=res["reasoning"],
            retrieved_documents=res["retrieved_documents"]
        )
    except Exception as exc:
        logger.error(f"Ask Repository failed: {exc}")
        return AskRepositoryResponse(
            answer=f"I'm sorry, I am unable to answer your query because the AI service API quota has been exhausted. Please try again later. Details: {exc}",
            reasoning=f"Error encountered during API request execution: {exc}",
            retrieved_documents=[]
        )
