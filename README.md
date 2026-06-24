# PRSense

Repository Analysis, Semantic Search, and Pull Request Review Platform

PRSense is a system designed to perform static codebase analysis, repository semantic search, and pull request audits. It integrates with GitHub webhooks to analyze source code diffs, cross-reference them against stored codebase context, and run specialized audit modules to flag code quality, security, styling, and test coverage concerns.

---

## Overview

The system operates on a decoupled architecture composed of a Java Spring Boot orchestrator, a Python FastAPI analysis service, and a PostgreSQL database extended with `pgvector`. 

When a user registers a repository, the system indexer extracts, chunks, and generates vector embeddings for all code files, storing them for semantic retrieval. During subsequent pull request events, GitHub webhooks trigger the review pipeline, which retrieves codebase context using vector queries and runs concurrent evaluation modules to verify code safety and styling consistency.

---

## Current Capabilities

- **Repository Indexing and Semantic Retrieval**: Clones codebase versions, chunks files, generates embeddings, and indexes them for queries.
- **Pull Request Review Execution**: Automatically analyzes PR diffs and generates structural audit reports.
- **GitHub Webhook Integration**: Receives real-time PR events to trigger checks without manual pipeline runs.
- **Concurrent Review Agents**: Evaluates changes simultaneously for security, code style, architecture, and tests.
- **Vector Search using pgvector**: Utilizes HNSW indexes and cosine similarity for contextual RAG searches.
- **Review Telemetry and Execution Tracking**: Reports database statuses, average review runtimes, and analysis costs.
- **PDF Audit Export**: Exports full codebase reviews to clean, printable corporate formats.

---

## System Architecture

The following diagram illustrates the deployment layout and information flow across the system components:

```mermaid
graph TD
    ReactFrontend[React Frontend] --> SpringBootBackend[Spring Boot Backend]
    GitHubWebhook[GitHub Webhook] --> SpringBootBackend
    SpringBootBackend --> FastAPIAnalysisService[FastAPI Analysis Service]
    FastAPIAnalysisService --> GitRepositoryClone[Git Repository Clone]
    FastAPIAnalysisService --> PostgreSQL[PostgreSQL]
    PostgreSQL --> pgvector[pgvector]
```

---

## Technology Stack

- **Frontend Application**: React, Vite, Tailwind CSS, Framer Motion
- **Backend Service**: Spring Boot, Spring Security (JWT authentication), JPA / Hibernate
- **Analysis Service**: FastAPI, Python `BackgroundTasks`, LangGraph
- **Database**: PostgreSQL with the `pgvector` extension

---

## Design Decisions

### Direct HTTP Communication
The system uses direct HTTP communication between Spring Boot and the Analysis Service. A queue-based architecture was intentionally avoided to reduce deployment complexity and infrastructure requirements for small and medium-sized workloads.

### PostgreSQL + pgvector
Repository context is stored in PostgreSQL using pgvector to simplify operational overhead while supporting semantic retrieval.

### Background Processing
FastAPI BackgroundTasks are used for indexing and review execution to prevent blocking HTTP requests.

---

## Project Structure

```
prsense/
├── prsense-frontend/          # React frontend application
├── prsense-backend/           # Spring Boot backend service
├── prsense-ai-service/        # FastAPI analysis service
├── docs/                      # Technical documentation
├── screenshots/               # Application interface walkthroughs
└── README.md                  # Project documentation
```

---

## Data Model

### Core Entities
- **Repository**: Stores git metadata, indexing states, and synchronization timestamps.
- **Pull Request**: Tracks imported PR records, commit hashes, and status states.
- **Review**: Persists overall analysis outcomes, severity counts, and execution metrics.
- **Review Finding**: Houses specific audit issues, recommendations, and source code line positions.
- **Repository Snapshot**: Maintains high-level architectural metrics and codebase health scores.

### Vector Storage
- `memory_documents`: Stores raw codebase text chunks and their 1536-dimension embeddings.
- `style_guidelines`: Stores project rule definitions and their corresponding vectors.

*Repository metadata is stored in PostgreSQL through JPA/Hibernate. Semantic search data is stored using pgvector embeddings.*

---

## Core Operational Flows

### Repository Indexing Flow

```mermaid
sequenceDiagram
    participant UI as React Frontend
    participant SB as Spring Boot Backend
    participant FA as Analysis Service
    participant DB as PostgreSQL (pgvector)
    
    UI->>SB: POST /api/repositories/{id}/index
    SB->>FA: POST /api/index/repository
    FA-->>SB: 202 Accepted (Background Triggered)
    SB-->>UI: Indexing Status: PENDING
    
    Note over FA: Clone Git repository to local disk
    Note over FA: Parse codebase into structural chunks
    Note over FA: Generate embeddings & update pgvector
    
    FA->>DB: INSERT chunks & summaries
    Note over FA: Delete temporary clone directory
    
    FA->>SB: POST /api/reviews/callback (Status: COMPLETED)
    SB->>DB: Update Repository Indexing Status
```

### Pull Request Review Flow

```mermaid
sequenceDiagram
    participant GH as GitHub Webhook
    participant SB as Spring Boot Backend
    participant FA as Analysis Service
    participant DB as PostgreSQL (pgvector)
    
    GH->>SB: POST /api/webhooks/github (PR event)
    Note over SB: Validate signature & save PR metadata
    SB->>FA: POST /api/review/run
    FA-->>SB: 202 Accepted
    
    Note over FA: Fetch PR diff via GitHub API
    FA->>DB: Query nearest codebase context (cosine similarity)
    Note over FA: Execute concurrent checks (Security, Style, etc.)
    
    FA->>DB: INSERT reviews & review_findings
    FA->>SB: POST /api/reviews/callback (Result summary)
    SB->>DB: Update Review Status to COMPLETED
```

---

## API Overview

### Backend Service (Spring Boot)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticates user credentials and returns a JWT. |
| `POST` | `/api/auth/register` | Registers a new user account. |
| `GET` | `/api/repositories` | Lists linked repositories. |
| `POST` | `/api/repositories/link` | Links a GitHub repository to a workspace. |
| `POST` | `/api/repositories/{id}/index` | Dispatches an indexing call to the Analysis Service. |
| `GET` | `/api/repositories/{id}/pulls` | Lists pull requests imported for a repository. |
| `GET` | `/api/pulls/{id}/reviews` | Returns the review log for a pull request. |
| `GET` | `/api/reviews/{id}` | Fetches a completed review report. |
| `POST` | `/api/webhooks/github` | Public webhook target for GitHub event dispatches. |
| `GET` | `/health` / `/api/health` | Diagnostic status check endpoint. |

### Analysis Service (FastAPI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/index/repository` | Launches asynchronous cloning and embedding generation. |
| `POST` | `/api/review/run` | Launches asynchronous PR diff code reviews. |
| `POST` | `/api/rag/ingest` | Generates embeddings for a single text block. |
| `POST` | `/api/rag/search` | Queries the nearest vector chunks. |
| `POST` | `/api/repository/ask` | Runs conversational context searches. |
| `GET` | `/health` | Diagnostic status endpoint reporting database and pipeline health. |

---

## Local Development Setup

### Prerequisites

- Java Development Kit (JDK) 17 or higher
- Python 3.11 or higher
- Node.js 18 or higher (with npm)
- PostgreSQL (v15+) with `pgvector` extension installed
- Git CLI

### Setup Sequence

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ansh62949/prsense-ai.git
   cd prsense-ai
   ```
2. **Database Setup**:
   Ensure PostgreSQL is running and the vector extension is loaded:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. **Analysis Service**:
   Navigate to `/prsense-ai-service`, create a Python virtual environment, install `requirements.txt`, and start the app:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
4. **Backend Service**:
   Navigate to `/prsense-backend` and run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
5. **Frontend Portal**:
   Navigate to `/prsense-frontend`, run `npm install` and start the development server:
   ```bash
   npm run dev
   ```

For detailed configurations on model switches and provider API configurations, see [docs/configuration.md](docs/configuration.md).

---

## Required Variables

The core services require the following variables to be configured in your environment or root `.env` file:

- `DATABASE_URL`: Connection string for PostgreSQL (e.g. `postgresql://user:pass@localhost:5432/prsense_db`).
- `JWT_SECRET`: Secret token used to sign Spring Security session tokens.
- `GITHUB_TOKEN`: GitHub Personal Access Token used to clone repositories and request pull request diffs.
- `GROQ_API_KEY`: API credential key when using the active model provider.

*For a full list of environmental settings, refer to the [Configuration Guide](docs/configuration.md).*

---

## Deployment

The system is deployed across the following hosting platforms and URLs:

| Service | Host | Live / Production Address | Description |
|---------|------|---------------------------|-------------|
| **Frontend UI** | Vercel | [prsense-ai.vercel.app](https://prsense-ai.vercel.app/) | React Web Application Portal |
| **Backend Service** | Render | [prsense-ai-1.onrender.com](https://prsense-ai-1.onrender.com/) | Spring Boot Orchestrator & API |
| **Analysis Service** | Render | [prsense-ai.onrender.com](https://prsense-ai.onrender.com/) | FastAPI Analysis Service |
| **Backend Swagger** | Render | [Swagger UI](https://prsense-ai-1.onrender.com/swagger-ui/index.html) | Interactive API documentation |
| **Analysis OpenAPI** | Render | [OpenAPI Docs](https://prsense-ai.onrender.com/docs) | Interactive API playground |

*Note: The Analysis Service requires its `BACKEND_CALLBACK_URL` and `BACKEND_URL` environment variables to be explicitly set to the deployed backend domain in production to complete asynchronous task dispatches.*

---

## Monitoring

- **Service Diagnostics**:
  - `/health` in Spring Boot returns `200 OK` validating database connectivity.
  - `/health` in FastAPI checks database connections and verifies the presence of the `pgvector` extension.
- **Telemetry Dashboard**:
  - Live metric pages track operational health, processing runtimes, API success rates, and token cost metrics.


---


## Current Limitations

- Reviews are optimized for GitHub repositories.
- Large repositories may require longer indexing times.
- Semantic retrieval quality depends on repository documentation quality.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
