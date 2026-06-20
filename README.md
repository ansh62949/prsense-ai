# PRSense - Autonomous Pull Request Review & Repository Intelligence Platform

![PRSense](https://img.shields.io/badge/platform-production--grade-blue)
![License](https://img.shields.io/badge/license-proprietary-red)
![Status](https://img.shields.io/badge/status-actively%20developed-green)

🚀 **Live Frontend Portal**: [https://prsense-ai.vercel.app/](https://prsense-ai.vercel.app/)  
🚀 **Live Code Analyzer Service**: [https://prsense-ai.onrender.com/](https://prsense-ai.onrender.com/)  
📝 **Code Analyzer API Docs (Swagger UI)**: [https://prsense-ai.onrender.com/docs](https://prsense-ai.onrender.com/docs)  
📝 **Backend API Docs (Swagger UI)**: [https://prsense-ai-1.onrender.com/swagger-ui/index.html](https://prsense-ai-1.onrender.com/swagger-ui/index.html)


PRSense is a **premium, Automated SaaS platform** designed to automate GitHub Pull Request reviews, analyze code safety, styles, and architectures, and provide deep repository-wide conversational intelligence. Built with a Spring Boot Java backend, a Vite + React + Framer Motion premium frontend, and a FastAPI + Workflow Engine Python AI service.

---

## 🎯 Vision

PRSense bridges the gap between static analysis tools, code reviews, and developer workspace intelligence by providing:
- **Autonomous Multi-Stage Reviews**: Specialized code analyzers evaluating pull requests in parallel.
- **Semantic Code Search (Semantic Search)**: Indexing codebase standards, design patterns, and context.
- **Conversational Repository Chat**: "Query Codebase" allows developers to ask questions directly about their codebase with pinpoint code citations.
- **Interactive Review Workspaces**: Sleek, glassmorphic UI displaying file diffs, finding lists, severity filters, and timeline analysis.

---

## ✨ Key Features

### 1. **Workflow Engine-Powered Multi-Stage Review**
- **Security Auditor**: Scans for vulnerabilities, OWASP Top 10 issues, hardcoded secrets, and unsafe dependencies.
- **Architecture Auditor**: Evaluates structural soundness, anti-patterns, design patterns, and package coupling.
- **Style Auditor**: Monitors code cleanliness, formatting, naming conventions, and documentation.
- **Code Quality Analyzer**: Finds logic bugs, resource leaks, syntax improvements, and performance bottlenecks.
- Parallel evaluation with StateGraph state-machine workflows.

### 2. **Repository Intelligence & Chat**
- Upload or index repositories.
- "Query Codebase" conversational search powered by Semantic Search.
- Code snippet highlighting and reference mapping.

### 3. **Premium Developer Experience**
- Elegant dark mode with custom curated color palettes.
- Fluid glassmorphic UI cards and interactive components.
- Smooth transitions and micro-animations via Framer Motion.
- Clean review reports, timelines, and dashboard analytics.

---

## 📁 Project Structure

```
prsense/
├── prsense-frontend/          # React + Vite + Tailwind + Framer Motion
│   ├── src/
│   │   ├── pages/              # Premium views: CommandCenter, PullRequestWorkspace, AskRepository, etc.
│   │   └── components/         # Layout & Reusable UI elements
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── prsense-backend/           # Java Spring Boot Backend
│   ├── src/
│   │   ├── main/java/...       # Entities, Repositories, Services, and Controllers
│   │   └── main/resources/     # Application Configuration (application.yml)
│   └── pom.xml
│
├── prsense-service/        # Python FastAPI + Workflow Engine AI Service
│   ├── main.py                # API Endpoints
│   ├── celery_worker.py       # Async Task Queue
│   ├── graph/                 # Workflow Engine Multi-Stage Workflows
│   ├── services/              # Analysis Core integration & Semantic Search database utility
│   └── requirements.txt       # Python dependencies
│
├── .gitignore                 # Root Git Ignore configuration
├── deploy.sh                  # Setup & Deployment script
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (Installed and running)
- **Java 17+** (Optional, if running backend locally without Docker)
- **Python 3.11+** (Optional, if running AI service locally without Docker)
- **Node.js 18+** (Optional, if running frontend locally without Docker)
- **Analysis Engine or Audit Core API Key**

### Installation & Deployment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ansh62949/prsense.git
   cd prsense
   ```

2. **Configure Environment**
   Create a `.env` file at the root:
   ```env
   OPENAI_API_KEY=your-analysis engine-api-key-here
   GEMINI_API_KEY=your-audit core-api-key-here
   ```

3. **Deploy Using the Script**
   ```bash
   bash deploy.sh
   ```
   This script builds and starts the PostgreSQL database, Redis instance, Java backend, Python AI service, and Celery worker.

---

## 🛠️ Service Architecture & Endpoints

| Service | Local Address | Live/Production Address | Description |
|---------|---------------|-------------------------|-------------|
| **Frontend** | `http://localhost:3000` | [https://prsense-ai.vercel.app/](https://prsense-ai.vercel.app/) | React web application portal |
| **Backend API** | `http://localhost:8080` | [https://prsense-ai-1.onrender.com/](https://prsense-ai-1.onrender.com/) | Spring Boot orchestrator, user accounts, OAuth |
| **Backend Swagger UI** | `http://localhost:8080/swagger-ui.html` | [https://prsense-ai-1.onrender.com/swagger-ui/index.html](https://prsense-ai-1.onrender.com/swagger-ui/index.html) | Spring Boot interactive API testing documentation |
| **Code Analyzer Service** | `http://localhost:8000` | [https://prsense-ai.onrender.com/](https://prsense-ai.onrender.com/) | FastAPI Workflow Engine agent microservice |
| **Analyzer Swagger UI** | `http://localhost:8000/docs` | [https://prsense-ai.onrender.com/docs](https://prsense-ai.onrender.com/docs) | FastAPI interactive API testing documentation |

---

**Built with ❤️ for Modern Engineering Teams**
