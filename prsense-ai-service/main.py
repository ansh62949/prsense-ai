import logging
import os

# Initialize logging configuration before any local imports
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("APIService")

from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(dotenv_path="../.env")

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from routers import review, ask_repository, repository_profile, learner, monitoring, indexing
from services.rag_service import rag_service

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
app.include_router(indexing.router)

@app.on_event("startup")
async def startup_event():
    # Startup validation
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    logger.info(f"Starting AI service with provider: {provider}")
    
    # Validate BACKEND_URL or production BACKEND_CALLBACK_URL
    backend_url = os.getenv("BACKEND_URL")
    backend_callback = os.getenv("BACKEND_CALLBACK_URL")
    is_valid_prod_callback = backend_callback and "localhost" not in backend_callback and "127.0.0.1" not in backend_callback
    
    if not backend_url and not is_valid_prod_callback:
        if os.getenv("RENDER") == "true" or os.getenv("PORT") is not None:
            raise RuntimeError(
                "Either BACKEND_URL or a production BACKEND_CALLBACK_URL environment variable is required in production! "
                "Please add BACKEND_URL (e.g. https://prsense-backend.onrender.com) to the environment variables in your Render dashboard."
            )
        else:
            logger.warning("WARNING: BACKEND_URL and BACKEND_CALLBACK_URL are missing! Callbacks will default to localhost:8080.")
    else:
        from services.async_task_service import BACKEND_CALLBACK_URL as resolved_callback
        logger.info(f"Resolved callback URL: {resolved_callback}")
        
    if provider == "gemini" and not gemini_key:
        logger.warning("WARNING: GEMINI_API_KEY is not configured but provider is set to gemini!")
    elif provider == "openai" and not openai_key:
        logger.warning("WARNING: OPENAI_API_KEY is not configured but provider is set to openai!")
    elif provider == "groq" and not groq_key:
        logger.warning("WARNING: GROQ_API_KEY is not configured but provider is set to groq!")
    else:
        logger.info("LLM credentials verified")
        
    # Check connections & validate pgvector
    try:
        conn = rag_service._get_conn()
        if conn:
            with conn.cursor() as cur:
                cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
                ext = cur.fetchone()
                if ext:
                    logger.info("Database connected")
                else:
                    logger.warning("Database connected without pgvector")
        else:
            logger.warning("Database connection failed")
    except Exception as e:
        logger.warning(f"Error connecting/validating pgvector on startup: {e}")

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "PRSense AI Service Engine"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
async def health(response: Response):
    health_status = {"status": "UP"}
    db_ok = False

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

    if db_ok:
        health_status["status"] = "UP"
    else:
        health_status["status"] = "DOWN"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return health_status

