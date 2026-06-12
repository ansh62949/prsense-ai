import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(dotenv_path="../.env")

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from routers import review, ask_repository, repository_profile, learner, monitoring
from services.rag_service import rag_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PRSenseAPI")

app = FastAPI(
    title="PRSense AI Service",
    version="1.0.0",
    description="Automated PR review service powered by LangGraph and OpenAI GPT-4o-mini.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all modular routers
app.include_router(review.router)
app.include_router(ask_repository.router)
app.include_router(repository_profile.router)
app.include_router(learner.router)
app.include_router(monitoring.router)

@app.on_event("startup")
async def startup_event():
    # Startup validation
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    logger.info(f"Starting PRSense AI Service with LLM provider: {provider}")
    
    if provider == "gemini" and not gemini_key:
        logger.warning("WARNING: GEMINI_API_KEY is not configured but provider is set to gemini!")
    elif provider == "openai" and not openai_key:
        logger.warning("WARNING: OPENAI_API_KEY is not configured but provider is set to openai!")
    else:
        logger.info("LLM Provider credentials validated.")
        
    # Check connections & validate pgvector
    try:
        conn = rag_service._get_conn()
        if conn:
            with conn.cursor() as cur:
                cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
                ext = cur.fetchone()
                if ext:
                    logger.info("Successfully connected to Database and verified pgvector extension is enabled on startup.")
                else:
                    logger.warning("Database connected, but pgvector extension is NOT enabled on startup.")
        else:
            logger.warning("Could not connect to Database on startup.")
    except Exception as e:
        logger.warning(f"Error connecting/validating pgvector on startup: {e}")

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "PRSense AI Service Engine"
    }

@app.get("/health")
async def health(response: Response):
    health_status = {"status": "UP"}
    db_ok = False
    redis_ok = False

    # Check Database connection
    if rag_service:
        try:
            conn = rag_service._get_conn()
            if conn is not None:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1;")
                db_ok = True
                health_status["database"] = "UP"
            else:
                health_status["database"] = "DOWN"
        except Exception as e:
            health_status["database"] = f"DOWN: {str(e)}"
    else:
        health_status["database"] = "DISABLED"

    # Check Redis connection
    if rag_service and rag_service.redis_client:
        try:
            rag_service.redis_client.ping()
            redis_ok = True
            health_status["redis"] = "UP"
        except Exception as e:
            health_status["redis"] = f"DOWN: {str(e)}"
    else:
        try:
            import redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            client = redis.Redis.from_url(redis_url, decode_responses=True)
            client.ping()
            redis_ok = True
            health_status["redis"] = "UP"
        except Exception as e:
            health_status["redis"] = f"DOWN: {str(e)}"

    if db_ok and redis_ok:
        health_status["status"] = "UP"
    else:
        health_status["status"] = "DOWN"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return health_status

