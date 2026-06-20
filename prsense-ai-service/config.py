import os

# Cost and Sizing Controls
MAX_TOKENS_PER_REVIEW = int(os.getenv("MAX_TOKENS_PER_REVIEW", "150000"))
MAX_FILES_PER_PR = int(os.getenv("MAX_FILES_PER_PR", "20"))
MAX_PR_SIZE_KB = int(os.getenv("MAX_PR_SIZE_KB", "500"))

# Provider Configuration
from services.llm_provider import LLM_PROVIDER, llm_provider
LLM_MODEL = llm_provider.llm_model
EMBEDDING_MODEL = llm_provider.embedding_model

def sanitize_repo_name(repo_name: str) -> str:
    if not repo_name:
        return repo_name
    repo_name = repo_name.strip()
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]
    prefixes = [
        "https://github.com/",
        "http://github.com/",
        "git@github.com:",
        "github.com/"
    ]
    for prefix in prefixes:
        if repo_name.startswith(prefix):
            repo_name = repo_name[len(prefix):]
            break
    return repo_name.strip("/")

