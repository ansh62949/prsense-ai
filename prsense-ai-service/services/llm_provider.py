import os
import logging
from typing import Any

logger = logging.getLogger("LLMProvider")
logger.setLevel(logging.INFO)

# Load environment configurations
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Standard auto-switching logic if credentials dictate it
if not LLM_PROVIDER or LLM_PROVIDER not in ["openai", "gemini", "groq"]:
    if GROQ_API_KEY:
        LLM_PROVIDER = "groq"
    elif GEMINI_API_KEY:
        LLM_PROVIDER = "gemini"
    elif OPENAI_API_KEY:
        LLM_PROVIDER = "openai"
    else:
        LLM_PROVIDER = "gemini"

logger.info(f"Initializing LLM Provider: {LLM_PROVIDER.upper()}")

class GeminiEmbeddings:
    def __init__(self, model: str, api_key: str):
        self.model = model
        self.api_key = api_key

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        import requests
        import time
        
        if not texts:
            return []
            
        chunk_size = 30
        all_embeddings = []
        
        for idx in range(0, len(texts), chunk_size):
            batch = texts[idx:idx+chunk_size]
            
            # Rate-limiting baseline sleep
            time.sleep(0.5)
            
            max_retries = 3
            backoff = 1.0
            batch_success = False
            
            for attempt in range(max_retries):
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:batchEmbedContents?key={self.api_key}"
                    requests_payload = []
                    for t in batch:
                        requests_payload.append({
                            "model": f"models/{self.model}",
                            "content": {"parts": [{"text": t}]},
                            "outputDimensionality": 1536
                        })
                    
                    payload = {"requests": requests_payload}
                    r = requests.post(url, json=payload, timeout=15)
                    
                    if r.status_code == 200:
                        embeddings_list = r.json().get("embeddings", [])
                        for emb in embeddings_list:
                            values = emb.get("values", [])
                            if len(values) < 1536:
                                values = values + [0.0] * (1536 - len(values))
                            all_embeddings.append(values)
                        batch_success = True
                        break
                    elif r.status_code == 429:
                        logger.warning(f"Gemini batch embeddings rate limit (429) on attempt {attempt+1}/{max_retries}. Retrying in {backoff}s...")
                        time.sleep(backoff)
                        backoff *= 2
                    else:
                        logger.warning(f"Gemini batch embeddings failed (status {r.status_code}) on attempt {attempt+1}: {r.text}. Retrying in {backoff}s...")
                        time.sleep(backoff)
                        backoff *= 2
                except Exception as e:
                    logger.warning(f"Failed to generate Gemini batch embedding (attempt {attempt+1}/{max_retries}): {e}. Retrying in {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2
            
            if not batch_success:
                logger.error(f"Gemini batch embedding failed completely for batch size {len(batch)}")
                for _ in batch:
                    all_embeddings.append([0.0] * 1536)
                    
        return all_embeddings

    def embed_query(self, text: str) -> list[float]:
        import requests
        import time
        
        # Rate-limiting baseline sleep to keep request frequency clean
        time.sleep(0.5)
        
        max_retries = 3
        backoff = 1.0
        
        for attempt in range(max_retries):
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:embedContent?key={self.api_key}"
                payload = {
                    "content": {"parts": [{"text": text}]},
                    "outputDimensionality": 1536
                }
                r = requests.post(url, json=payload, timeout=10)
                
                if r.status_code == 200:
                    values = r.json().get("embedding", {}).get("values", [])
                    if len(values) < 1536:
                        # Pad to 1536 dimensions to match database schema columns
                        values = values + [0.0] * (1536 - len(values))
                    return values
                elif r.status_code == 429:
                    logger.warning(f"Gemini embeddings rate limit (429) on attempt {attempt+1}/{max_retries}. Retrying in {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    logger.warning(f"Gemini native embeddings failed (status {r.status_code}) on attempt {attempt+1}: {r.text}. Retrying in {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2
            except Exception as e:
                logger.warning(f"Failed to generate Gemini native embedding (attempt {attempt+1}/{max_retries}): {e}. Retrying in {backoff}s...")
                time.sleep(backoff)
                backoff *= 2
                
        return [0.0] * 1536

class LLMProvider:
    def __init__(self):
        self._llm = None
        self._embeddings = None
        
        # Verify base dependencies
        try:
            from langchain_openai import ChatOpenAI, OpenAIEmbeddings
            self.ChatOpenAI = ChatOpenAI
            self.OpenAIEmbeddings = OpenAIEmbeddings
        except ImportError as e:
            logger.error(f"Failed to import langchain-openai: {e}")
            self.ChatOpenAI = None
            self.OpenAIEmbeddings = None

    @property
    def llm_model(self) -> str:
        if LLM_PROVIDER == "groq":
            return "llama-3.3-70b-versatile"
        elif LLM_PROVIDER == "gemini":
            return "gemini-2.5-flash"
        return "gpt-4o-mini"

    @property
    def embedding_model(self) -> str:
        if LLM_PROVIDER in ["gemini", "groq"]:
            return "gemini-embedding-2"
        return "text-embedding-3-large"

    def get_llm(self, temperature: float = 0.2) -> Any:
        if self.ChatOpenAI is None:
            logger.error("ChatOpenAI dependency not loaded.")
            return None
            
        models_list = []
        
        # 1. Main model with failover fallback chain configuration
        if LLM_PROVIDER == "groq":
            if GROQ_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="llama-3.3-70b-versatile",
                    temperature=temperature,
                    openai_api_key=GROQ_API_KEY,
                    base_url="https://api.groq.com/openai/v1"
                ))
            if GEMINI_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="gemini-2.5-flash",
                    temperature=temperature,
                    openai_api_key=GEMINI_API_KEY,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
                ))
            if OPENAI_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="gpt-4o-mini",
                    temperature=temperature,
                    openai_api_key=OPENAI_API_KEY
                ))
        elif LLM_PROVIDER == "gemini":
            if GEMINI_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="gemini-2.5-flash",
                    temperature=temperature,
                    openai_api_key=GEMINI_API_KEY,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
                ))
            if GROQ_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="llama-3.3-70b-versatile",
                    temperature=temperature,
                    openai_api_key=GROQ_API_KEY,
                    base_url="https://api.groq.com/openai/v1"
                ))
            if OPENAI_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="gpt-4o-mini",
                    temperature=temperature,
                    openai_api_key=OPENAI_API_KEY
                ))
        else:
            if OPENAI_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="gpt-4o-mini",
                    temperature=temperature,
                    openai_api_key=OPENAI_API_KEY
                ))
            if GROQ_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="llama-3.3-70b-versatile",
                    temperature=temperature,
                    openai_api_key=GROQ_API_KEY,
                    base_url="https://api.groq.com/openai/v1"
                ))
            if GEMINI_API_KEY:
                models_list.append(self.ChatOpenAI(
                    model="gemini-2.5-flash",
                    temperature=temperature,
                    openai_api_key=GEMINI_API_KEY,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
                ))
                
        if not models_list:
            logger.error("No API Keys configured for any LLM provider.")
            return None
            
        if len(models_list) > 1:
            return models_list[0].with_fallbacks(models_list[1:])
        return models_list[0]

    def get_embeddings(self) -> Any:
        if LLM_PROVIDER in ["gemini", "groq"]:
            if GEMINI_API_KEY:
                return GeminiEmbeddings(
                    model="gemini-embedding-2",
                    api_key=GEMINI_API_KEY
                )
        if self.OpenAIEmbeddings is None:
            logger.error("OpenAIEmbeddings dependency not loaded.")
            return None
        if not OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY is missing. OpenAI embeddings may fail.")
        return self.OpenAIEmbeddings(
            model="text-embedding-3-large",
            dimensions=1536,
            openai_api_key=OPENAI_API_KEY
        )

llm_provider = LLMProvider()
