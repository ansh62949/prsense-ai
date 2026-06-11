import os

# Cost and Sizing Controls
MAX_TOKENS_PER_REVIEW = int(os.getenv("MAX_TOKENS_PER_REVIEW", "150000"))
MAX_FILES_PER_PR = int(os.getenv("MAX_FILES_PER_PR", "20"))
MAX_PR_SIZE_KB = int(os.getenv("MAX_PR_SIZE_KB", "500"))

# Provider Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()  # 'openai' or 'gemini'
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")

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

