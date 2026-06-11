# PRSense AI Service

A FastAPI service that runs automated GitHub Pull Request reviews using LangGraph and LangChain.

## Features
- Four specialized AI agents: Static Analysis, Security, Architecture, and Style
- Parallel agent execution using LangGraph StateGraph
- Structured review output with findings, severity, file path, line references, recommendation, and confidence score
- Optional PostgreSQL + pgvector retrieval for RAG-style style standard context
- OpenAI GPT-4o-mini integration

## Install
```bash
cd "prsense-ai-service"
pip install -r requirements.txt
```

## Environment
Create a `.env` file with at least:
```bash
OPENAI_API_KEY=sk-...
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=prsense_vectors
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secret
```

## Run
```bash
cd "prsense-ai-service"
uvicorn main:app --host 0.0.0.0 --port 9000 --reload
```

## API
`POST /review`

Request body:
```json
{
  "pr_diff": "...",
  "repo_name": "prsense-backend",
  "pr_title": "Improve review assistant"
}
```

Response:
- `findings`
- `overall_severity`
- `summary`
- `confidence`
