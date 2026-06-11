# PRSense AI - Autonomous Pull Request Review & Repository Intelligence Platform

![PRSense AI](https://img.shields.io/badge/platform-production--grade-blue)
![License](https://img.shields.io/badge/license-proprietary-red)
![Status](https://img.shields.io/badge/status-actively%20developed-green)

PRSense AI is a **premium, AI-native SaaS platform** designed to automate GitHub Pull Request reviews, analyze code safety, styles, and architectures, and provide deep repository-wide conversational intelligence. Built with a Spring Boot Java backend, a Vite + React + Framer Motion premium frontend, and a FastAPI + LangGraph Python AI service.

---

## 🎯 Vision

PRSense AI bridges the gap between static analysis tools, code reviews, and developer workspace intelligence by providing:
- **Autonomous Multi-Agent Reviews**: Specialized AI agents evaluating pull requests in parallel.
- **Semantic Code Search (RAG)**: Indexing codebase standards, design patterns, and context.
- **Conversational Repository Chat**: "Ask Repository" allows developers to ask questions directly about their codebase with pinpoint code citations.
- **Interactive Review Workspaces**: Sleek, glassmorphic UI displaying file diffs, finding lists, severity filters, and timeline analysis.

---

## ✨ Key Features

### 1. **LangGraph-Powered Multi-Agent Review**
- **Security Agent**: Scans for vulnerabilities, OWASP Top 10 issues, hardcoded secrets, and unsafe dependencies.
- **Architecture Agent**: Evaluates structural soundness, anti-patterns, design patterns, and package coupling.
- **Style Agent**: Monitors code cleanliness, formatting, naming conventions, and documentation.
- **Static Analysis Agent**: Finds logic bugs, resource leaks, syntax improvements, and performance bottlenecks.
- Parallel evaluation with StateGraph state-machine workflows.

### 2. **Repository Intelligence & Chat**
- Upload or index repositories.
- "Ask Repository" conversational search powered by RAG.
- Code snippet highlighting and reference mapping.

### 3. **Premium Developer Experience**
- Elegant dark mode with custom curated color palettes.
- Fluid glassmorphic UI cards and interactive components.
- Smooth transitions and micro-animations via Framer Motion.
- Clean review reports, timelines, and dashboard analytics.

---

## 📁 Project Structure

```
prsense-ai/
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
├── prsense-ai-service/        # Python FastAPI + LangGraph AI Service
│   ├── main.py                # API Endpoints
│   ├── celery_worker.py       # Async Task Queue
│   ├── graph/                 # LangGraph Multi-Agent Workflows
│   ├── services/              # LLM integration & RAG database utility
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
- **OpenAI or Gemini API Key**

### Installation & Deployment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ansh62949/prsense-ai.git
   cd prsense-ai
   ```

2. **Configure Environment**
   Create a `.env` file at the root:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. **Deploy Using the Script**
   ```bash
   bash deploy.sh
   ```
   This script builds and starts the PostgreSQL database, Redis instance, Java backend, Python AI service, and Celery worker.

---

## 🛠️ Service Architecture

| Service | Address | Description |
|---------|---------|-------------|
| **Frontend** | `http://localhost:3000` | React web application portal |
| **Backend API** | `http://localhost:8080` | Spring Boot orchestrator, user accounts, OAuth |
| **AI Agent Service** | `http://localhost:8000` | FastAPI LangGraph agent microservice |

---

**Built with ❤️ for Modern Engineering Teams**
