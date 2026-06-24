# Configuration Guide

This guide details the configuration settings and environment variables required to run PRSense.

## Environment Variables

A template file is available at `.env.example` at the root of the project.

### Database Settings

- `DATABASE_URL`: Connection string for the FastAPI analysis service to connect to PostgreSQL (e.g. `postgresql://user:pass@localhost:5432/prsense_db`).
- `SPRING_DATASOURCE_URL`: JDBC database URL for the Spring Boot backend service (e.g. `jdbc:postgresql://localhost:5432/prsense_db`).
- `DB_USER`: Database username.
- `DB_PASS`: Database password.
- `DB_HOST`: Hostname of the PostgreSQL server.
- `DB_PORT`: Port of the PostgreSQL server (default: `5432`).
- `DB_NAME`: Database name.

### Analysis Providers

PRSense supports multiple analysis providers. Configure the active provider and its corresponding API key.

- `LLM_PROVIDER`: The active model provider. Supported values are:
  - `gemini` (Default)
  - `openai`
  - `groq`

- `GEMINI_API_KEY`: API credential when using Gemini models.
- `OPENAI_API_KEY`: API credential when using OpenAI models.
- `GROQ_API_KEY`: API credential when using Groq models.

### Service Networking

- `AI_SERVICE_URL`: Base URL of the FastAPI Analysis Service (used by Spring Boot backend, e.g. `http://localhost:8000`).
- `WEBHOOK_BASE_URL`: Base URL of the Spring Boot backend service.
- `BACKEND_CALLBACK_URL`: Callback endpoint in Spring Boot where FastAPI posts asynchronous task results (default: `http://localhost:8080/api/reviews/callback`).

### Security & API Integration

- `JWT_SECRET`: Secret key used by Spring Security to sign and verify JWT tokens.
- `ALLOWED_ORIGINS`: CORS origins whitelist (comma-separated).
- `GITHUB_TOKEN`: GitHub Personal Access Token used to clone repositories and request pull request diffs.

### Frontend Configurations

- `VITE_API_BASE_URL`: API gateway target URL for the React application (Spring Boot endpoint).
- `VITE_AI_BASE_URL`: Direct analysis service target URL.
- `VITE_PROMETHEUS_URL`: Prometheus instance URL for metrics scraping.
- `VITE_GRAFANA_URL`: Grafana telemetry dashboard URL.
