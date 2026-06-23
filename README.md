# PRSense - AI-Powered Pull Request Audit & Repository Intelligence Platform

PRSense is a production-grade codebase intelligence platform designed to audit pull requests, verify code safety, check style rules, and provide repository-wide conversational search. 

The platform is designed around a modern three-tier architecture that utilizes direct asynchronous processing pipelines to review code diffs and coordinate analysis loops.

---

## 🏛️ System Architecture

PRSense operates using a direct-dispatch asynchronous pipeline flow to ensure fast response times and eliminate queueing overhead:

![PRSense Architecture](file:///C:/Users/satam/.gemini/antigravity/brain/3375c9ea-7e2e-4dba-bc18-6e4375ccb1bf/prsense_architecture_diagram_1782247803603.png)

### Architectural Flow
1. **Frontend (React + Vite + Tailwind)**: An interactive dark-mode dashboard that communicates with the backend via HTTP. Provides visual tools for diff reviews, RAG queries, and detailed PDF report exports.
2. **Backend (Spring Boot)**: Acts as the secure orchestrator. It registers webhook event notifications, persists user metadata, and directly dispatches asynchronous indexing and code review requests to the AI service.
3. **AI Service (FastAPI + Python)**: Manages static analysis, security scans, rule extraction (Rule Learner), and embedding generation.
4. **Knowledge Store (PostgreSQL + pgvector)**: Stores structural repository profiles, user/repo metadata, and vector embeddings of codebase chunks for Semantic Search context retrieval.

---

## ✨ Core Platform Capabilities

### 1. Multi-Stage Asynchronous Review Pipeline
Our direct-dispatch pipeline evaluates code changes concurrently using specialized agents:
- **Security Check**: Flags potential vulnerabilities, secrets exposure, and insecure dependencies.
- **Architecture Scanner**: Verifies package boundaries and structural invariants.
- **Style Standardizer**: Ensures consistency with project conventions.
- **Test Auditor**: Analyzes test coverage gaps, missing assertions, and mock validations.

### 2. 4-Dimensional Codebase Health Scores
Repository health is calculated across four key architectural dimensions instead of arbitrary percentages:
- 🛡️ **Security**: Vulnerability posture and secret scanning coverage.
- 📐 **Architecture**: Package coupling, dependency cycles, and clean code principles.
- 🎨 **Style & Standards**: Adherence to codebase style guidelines and naming conventions.
- 🧪 **Test Coverage**: Ratios of implementation components to unit and integration test assertions.

### 3. Print-to-PDF Audit Reports
Recruiters and security auditors can export formal review audit logs directly from the UI. Clicking **Export PDF** opens a printer-friendly template styled with a professional corporate layout, allowing immediate vector PDF print generation.

### 4. Telemetry-Backed Health Checks
Both primary services feature comprehensive health checks reporting connection health, LLM provider availability, and timestamps:
- **Spring Boot Endpoint (`/api/health`)**: Reports connection status of the PostgreSQL database, backend service status, and timestamp.
- **FastAPI Endpoint (`/health`)**: Performs active database connection test, verifies that the `pgvector` extension is enabled, and reports the active LLM provider (e.g. `GEMINI`, `GROQ`, `OPENAI`).

---

## 📁 Project Structure

```
prsense/
├── prsense-frontend/          # React + Vite + Tailwind + Framer Motion
│   ├── src/
│   │   ├── pages/              # Views (CommandCenter, AskRepository, Dashboard, etc.)
│   │   ├── components/         # Reusable UI cards, tables, layouts
│   │   └── lib/                # Client-side utility functions (PDF Export)
│   ├── package.json
│   └── vite.config.js
│
├── prsense-backend/           # Java Spring Boot Backend Service
│   ├── src/
│   │   ├── main/java/...       # Entities, Repositories, Services, and Controllers
│   │   └── main/resources/     # Application YAML configuration
│   └── pom.xml
│
└── prsense-ai-service/        # Python FastAPI AI Service
    ├── main.py                # Router and HTTP Endpoints
    ├── graph/                 # Multi-Stage Workflow orchestrator
    ├── services/              # pgvector utility and LLM integration
    └── requirements.txt       # Python dependencies
```

---

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (Installed and running)
- **Java 17+** (Optional, for local backend development)
- **Python 3.11+** (Optional, for local AI service development)
- **Node.js 18+** (Optional, for local frontend development)

### Deployment with Docker Compose

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ansh62949/prsense.git
   cd prsense
   ```

2. **Configure environment variables**:
   Create a `.env` file at the root:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. **Spin up the stack**:
   ```bash
   docker-compose -f docker-compose.production.yml up --build -d
   ```
   This deploys:
   - **PostgreSQL (pgvector)** on port `5432`
   - **Spring Boot Backend** on port `8080`
   - **FastAPI AI Service** on port `8000`

---

## 🛠️ Service Architecture & Endpoints

| Service | Local Address | Live/Production Address | Description |
|---------|---------------|-------------------------|-------------|
| **Frontend UI** | `http://localhost:3000` | `https://prsense-ai.vercel.app/` | React Web Application Portal |
| **Backend API** | `http://localhost:8080` | `https://prsense-ai-1.onrender.com/` | Spring Boot Orchestrator & API |
| **Backend Swagger** | `http://localhost:8080/swagger-ui.html` | `https://prsense-ai-1.onrender.com/swagger-ui/index.html` | Interactive API documentation |
| **AI Service** | `http://localhost:8000` | `https://prsense-ai.onrender.com/` | FastAPI AI analyzer service |
| **AI Swagger** | `http://localhost:8000/docs` | `https://prsense-ai.onrender.com/docs` | Interactive OpenAPI playground |
