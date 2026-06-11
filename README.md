# FlowGuard AI - Autonomous API Reliability Engineer Platform

![FlowGuard AI](https://img.shields.io/badge/platform-production--grade-blue)
![License](https://img.shields.io/badge/license-proprietary-red)
![Status](https://img.shields.io/badge/status-actively%20developed-green)

A **premium, AI-native infrastructure platform** for autonomous API testing, reliability engineering, and failure analysis. Built for enterprise teams who need production-grade observability with AI-powered insights.

## 🎯 Vision

FlowGuard AI brings together the best of:
- **Datadog's** monitoring excellence
- **Postman's** API testing usability
- **Grafana's** visualization power
- **Cursor's** AI-native design philosophy
- **Linear's** modern SaaS UX

All powered by **autonomous AI agents** that understand, test, and fix your APIs without human intervention.

## ✨ Key Features

### 1. **AI-Powered API Testing**
- Automatically generate comprehensive test cases from API specs
- Edge case and concurrency test generation
- Schema-aware payload creation
- Integration with Postman & Swagger

### 2. **Autonomous Failure Analysis**
- Real-time incident detection
- AI-driven root cause analysis (RCA)
- Confidence scoring for findings
- Cascading failure detection

### 3. **Multi-Agent Orchestration**
- 6 specialized AI agents working in concert
- LangGraph-based workflow execution
- State machine-driven processes
- Agent-to-agent communication

### 4. **RAG-Powered Intelligence**
- Vector embeddings of incidents, logs, and solutions
- Semantic search across knowledge base
- Historical context retrieval
- Learning from past incidents

### 5. **Enterprise Observability**
- Real-time metrics & dashboards
- Distributed tracing
- Log aggregation
- Service topology visualization

### 6. **Premium UX**
- Dark mode aesthetic
- Glassmorphism design
- Smooth animations (Framer Motion)
- Real-time updates
- Mobile responsive

## 📁 Project Structure

```
flowguard-ai/
├── flowguard-frontend/          # React + Tailwind + Framer Motion
│   ├── src/
│   │   ├── pages/              # 8 Premium pages
│   │   ├── components/         # Reusable UI components
│   │   └── store/              # State management (Zustand)
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── flowguard-backend/           # Java Spring Boot Microservices
│   ├── api-gateway/            # Request routing & auth
│   ├── auth-service/           # JWT/OAuth2
│   ├── api-discovery-service/  # Spec parsing
│   ├── test-generation-service/
│   ├── execution-engine/       # Test execution
│   ├── failure-analysis-service/
│   ├── rag-context-service/    # Vector search
│   ├── agent-orchestrator-service/
│   ├── bug-report-service/
│   ├── notification-service/
│   ├── shared-library/         # Common utilities
│   ├── docker-compose.yml      # Infrastructure
│   └── database-schema.sql     # PostgreSQL schema
│
├── flowguard-ai/                # Python AI Services
│   ├── orchestrator.py          # Multi-agent LangGraph
│   ├── rag_service.py          # RAG & embeddings
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile
│
├── infrastructure/              # DevOps & Deployment
│   ├── prometheus.yml           # Metrics collection
│   ├── grafana-dashboards/      # Monitoring
│   └── kubernetes/              # K8s manifests (optional)
│
├── DOCUMENTATION.md             # Comprehensive docs
├── README.md                    # This file
├── .env.example                 # Configuration template
├── deploy.sh                    # Deployment script
└── LICENSE
```

## 🚀 Quick Start

### Prerequisites
```bash
# Required
Docker & Docker Compose
Java 17+
Python 3.11+
Node.js 18+
OpenAI API key

# Optional but recommended
Git
Make
curl/httpie
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/flowguard/flowguard-ai.git
cd flowguard-ai

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Deploy with one command
bash deploy.sh

# Or manually:
docker-compose up -d

# 4. Install frontend
cd flowguard-frontend
npm install
npm run dev
```

### Access Services

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| Frontend | http://localhost:3000 | - |
| API Gateway | http://localhost:8080 | - |
| RabbitMQ Admin | http://localhost:15672 | flowguard / flowguard_secure_password |
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | - |

## 🏗️ Architecture

### Multi-Tier Architecture
```
┌─────────────────────────────────────────────┐
│         React Frontend (Port 3000)          │
│   Dashboard • Workflow • Testing • Analysis │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│      API Gateway (Port 8080)                │
│   Authentication • Rate Limiting • Routing  │
└────────┬──────────────┬──────────────┬──────┘
         │              │              │
    ┌────▼──┐      ┌────▼──┐     ┌────▼──┐
    │ Auth  │      │ Test  │     │Failure│
    │Service│      │Gen    │     │Analysis│
    └────┬──┘      └───┬───┘     └────┬──┘
         │             │              │
         └──────────┬──┴──────────────┘
                    │
         ┌──────────▼──────────┐
         │  Message Queue      │
         │  (RabbitMQ)         │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  AI Service Layer   │
         │  (Python/LangGraph) │
         │  6 Autonomous Agents│
         └──────────┬──────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼──┐        ┌───▼──┐       ┌───▼──┐
│ PgSQL│        │Redis │       │PgVector
│ 5432 │        │ 6379 │       │Embed  │
└──────┘        └──────┘       └───────┘
```

### Agent Workflow

```
API Spec
  ↓
1. API Understanding Agent
   ├─ Parse OpenAPI/Postman
   └─ Extract endpoints & schemas
  ↓
2. Test Generator Agent
   ├─ Create test cases
   ├─ Edge cases
   └─ Concurrency tests
  ↓
3. Execution Agent
   ├─ Sandbox execution
   └─ Result collection
  ↓
4. Failure Analysis Agent
   ├─ Root cause detection
   └─ Confidence scoring
  ↓
5. Recovery Agent
   ├─ Retry strategies
   └─ Fallback planning
  ↓
6. Bug Report Agent
   ├─ Issue generation
   └─ Fix recommendations
  ↓
Knowledge Base + Notifications
```

## 🧠 AI Agents

Each agent has specialized responsibilities:

### 1. **API Understanding Agent**
- Parses OpenAPI 3.0, Swagger 2.0, Postman collections
- Extracts endpoint metadata
- Identifies authentication requirements
- Maps service dependencies

### 2. **Test Generator Agent**
- Creates comprehensive test cases using LLM
- Generates edge cases automatically
- Builds concurrency & performance tests
- Schema-aware payload generation

### 3. **Execution Agent**
- Runs tests in isolated Docker sandboxes
- Collects detailed execution metrics
- Handles timeouts & retries
- Manages result aggregation

### 4. **Failure Analysis Agent**
- Analyzes logs & stack traces
- Performs root cause analysis with ML
- Detects cascading failures
- Provides confidence scores

### 5. **Recovery Agent**
- Plans recovery strategies
- Implements retry logic
- Applies circuit breaker patterns
- Manages fallback workflows

### 6. **Bug Report Agent**
- Generates detailed bug reports
- Recommends severity levels
- Provides reproduction steps
- Suggests fixes

## 📊 Frontend Pages

### 1. **Dashboard** (Overview)
- KPI cards with animations
- Real-time metrics
- Incident timeline
- Live execution feed
- Status distribution pie chart

### 2. **Agent Workflow**
- Multi-agent orchestration visualization
- Execution flow with animated edges
- Agent status indicators
- Detailed agent cards
- RAG memory access stats

### 3. **API Testing Console**
- Postman-like request builder
- API collection sidebar
- AI-generated test cases
- Response viewer with syntax highlighting
- Latency metrics

### 4. **Failure Analysis Center**
- Incident list with filtering
- AI root cause analysis
- Stack trace visualization
- Structured logs panel
- Recommended fixes

### 5. **Memory & RAG Explorer**
- Semantic search in knowledge base
- Vector similarity visualization
- Memory relationships graph
- Document embedding display
- Knowledge base statistics

### 6. **Bug Reports**
- Generated issue tickets
- Severity & status filtering
- Reproduction steps
- Suggested fixes
- Timeline history

### 7. **Observability & Monitoring**
- CPU, memory, disk usage charts
- Request throughput graphs
- Service health radar
- Agent performance metrics
- Infrastructure topology

### 8. **Live AI Execution Terminal**
- Real-time streaming logs
- Agent reasoning display
- Typing animations
- Execution timeline
- Workflow statistics

## 🔌 API Endpoints

### Core Workflow
```
POST   /api/workflow/execute              - Start workflow
GET    /api/workflow/{id}                 - Get status
GET    /api/workflow/{id}/logs            - Get execution logs
```

### Testing
```
POST   /api/tests/generate                - Generate tests
POST   /api/tests/execute                 - Run tests
GET    /api/tests/{id}/results            - Get results
```

### Analysis
```
GET    /api/incidents                     - List incidents
GET    /api/incidents/{id}                - Get incident
POST   /api/incidents/{id}/analyze        - Run analysis
```

### RAG & Knowledge
```
POST   /api/rag/search                    - Semantic search
POST   /api/rag/documents                 - Add document
GET    /api/rag/stats                     - KB statistics
```

## 🗄️ Database Schema

Key entities:
- **Users** - User accounts with RBAC
- **APISpecs** - OpenAPI/Postman specifications
- **Endpoints** - API endpoint metadata
- **TestCases** - Generated test cases
- **TestRuns** - Execution results
- **Incidents** - Detected failures
- **AgentExecutions** - Workflow logs
- **Embeddings** - Vector embeddings for RAG
- **MemoryDocuments** - Knowledge base

All with proper indexing for performance.

## 📈 Monitoring & Observability

### Metrics Collected
- Request latency (p50, p95, p99)
- Error rates and types
- Agent execution times
- Token usage (OpenAI)
- Queue depth
- Cache hit rates

### Dashboards
- System health overview
- Service performance
- Agent metrics
- Error trends
- Infrastructure topology

### Alerts
- High error rate (>5%)
- Slow responses (>1s)
- Queue backlog (>1000 messages)
- Service unavailability

## 🔒 Security

- **JWT Authentication** with RS256
- **OAuth2** support
- **API Key** management
- **RBAC** for fine-grained access
- **TLS/HTTPS** enforcement
- **Encrypted secrets** in transit & at rest
- **Sandboxed execution** for test runs
- **Audit logging** of all operations

## 🚢 Deployment

### Docker Compose
```bash
docker-compose up -d  # Start all services
```

### Kubernetes (Optional)
See `infrastructure/kubernetes/` for K8s manifests.

### Environment Variables
See `.env.example` for all configuration options.

### Scaling
```bash
docker-compose up -d --scale execution-engine=5
```

## 🛠️ Development

### Frontend Development
```bash
cd flowguard-frontend
npm install
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
```

### Backend Development
```bash
cd flowguard-backend/api-gateway
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

### AI Service Development
```bash
cd flowguard-ai
pip install -r requirements.txt
uvicorn orchestrator:app --reload
```

## 📚 Documentation

- [Full Documentation](./DOCUMENTATION.md)
- [API Reference](./API.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs -f service-name

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait for startup, then init schema
```

### AI Service Errors
- Verify OpenAI API key in `.env`
- Check Python dependencies: `pip list | grep lang`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Proprietary - FlowGuard AI Platform  
All rights reserved © 2024

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/flowguard/issues)
- **Email**: support@flowguard.ai
- **Docs**: https://docs.flowguard.ai
- **Community**: [Discord](https://discord.gg/flowguard)

---

**Built with ❤️ by the FlowGuard Team**

*Making API reliability intelligent, autonomous, and effortless.*

# prsense-ai
