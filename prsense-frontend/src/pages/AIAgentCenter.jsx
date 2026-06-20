import { API_BASE_URL } from "@/config/api";
import React, { useState, useEffect } from "react"
import ReactFlow, { Background, Controls, Position, Handle } from "reactflow"
import "reactflow/dist/style.css"
import { 
  Cpu, 
  Shield, 
  Zap, 
  Search, 
  PenTool, 
  Brain, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock,
  Play,
  RotateCcw,
  Activity,
  Terminal,
  Database,
  Coins,
  Settings,
  HelpCircle,
  Sparkles,
  Server
} from "lucide-react"
import { cn } from "@/lib/utils"

// CodeRabbit Circular White-Rabbit Logo Custom component
const CodeRabbitLogo = ({ className = "w-8 h-8" }) => (
  <div className={cn("rounded-full bg-[#ff5a1f] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0", className)}>
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
      <path d="M12 9c-2.8 0-5 2.2-5 5v3c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4v-3c0-2.8-2.2-5-5-5zm-2.5-7c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1zm5 0c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1z" />
    </svg>
  </div>
)

// Custom Node Component
const AgentNode = ({ data }) => {
  const isSelected = data.selectedNodeId === data.id;
  const isProcessing = data.activeNodeId === data.id;
  
  return (
    <div className={`px-4 py-3.5 rounded-xl border transition-all duration-300 min-w-[210px] ${
      isProcessing
        ? "bg-orange-950/80 border-[#ff5a1f] shadow-[0_0_20px_rgba(255,90,31,0.3)] scale-105" 
        : isSelected
          ? "bg-slate-900 border-[#ff5a1f]/70 shadow-[0_0_15px_rgba(255,90,31,0.1)]"
          : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:scale-102"
    }`}>
      {/* Node Input Connector */}
      {data.inputPosition !== "none" && (
        <Handle 
          type="target" 
          position={data.inputPosition || Position.Top} 
          className="w-2.5 h-2.5 !bg-[#ff5a1f] !border-slate-950" 
        />
      )}
      
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${
          isProcessing 
            ? "bg-[#ff5a1f]/20 text-[#ff5a1f] animate-pulse" 
            : "bg-slate-800 text-slate-350"
        }`}>
          <data.icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-xs text-white truncate">{data.label}</div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${
              isProcessing 
                ? "bg-[#ff5a1f] animate-ping" 
                : data.completed 
                  ? "bg-emerald-500" 
                  : "bg-slate-600"
            }`} />
            {isProcessing ? "Processing..." : data.completed ? "Idle (Completed)" : "Awaiting Trigger"}
          </div>
        </div>
      </div>
      
      {/* Mini Telemetry row */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-450 font-mono">
        <span className="flex items-center gap-0.5">
          <Clock className="w-3 h-3 text-slate-500" />
          {data.latency}
        </span>
        <span className="flex items-center gap-0.5">
          <Coins className="w-3 h-3 text-slate-500" />
          ${data.cost.toFixed(5)}
        </span>
      </div>

      {/* Node Output Connector */}
      {data.outputPosition !== "none" && (
        <Handle 
          type="source" 
          position={data.outputPosition || Position.Bottom} 
          className="w-2.5 h-2.5 !bg-[#ff5a1f] !border-slate-950" 
        />
      )}
    </div>
  )
}

const nodeTypes = {
  agent: AgentNode,
}

// System prompts database for each agent
const agentPrompts = {
  "coordinator": `You are the Coordinator Agent. Your task is to ingest a Git Pull Request diff and direct it to the appropriate sub-agents based on the file paths modified, programming languages, and scopes.
Required input: { pr_title, pr_diff, file_paths }.
Output: Router state dictionary with target analysis tracks.`,

  "static_analysis": `You are the Code Quality Analyzer. Audit the source code changes for complexity, clean code principles, dead code, nesting levels, and standard functional patterns.
Rules to enforce:
- Prefer early returns over deep nesting.
- Avoid duplicate logic in conditionals.
- Flag helper functions longer than 35 lines.`,

  "security_agent": `You are the Security Auditor. Scan the provided code diff for critical vulnerabilities, hardcoded secrets, api keys, SQL injection vectors, and weak cryptography implementations.
Target items:
- Check for password/secret assignments.
- SQL injection: check raw string interpolations in query executions.`,

  "architecture_agent": `You are the Architecture Boundary Agent. Inspect code structure to verify layer boundaries (e.g., Controllers should only invoke Services, Services should invoke Repositories).
Constraint matrix:
- Do not import database entities in controller classes.
- Detect circular class/module dependency cycles.`,

  "style_agent": `You are the Style Standard Agent. Audit syntax formatting, coding standards (camelCase vs snake_case), naming conventions, and docstring guidelines.
Conventions:
- JavaScript functions must use camelCase.
- Enforce strict typing comparisons (===) where applicable.`,

  "rag_retriever": `You are the Semantic context Semantic Search retriever. Query pgvector store for historical PR patterns, merged rule updates, and developer style preferences.
Query vector: { pr_title + files_metadata }
Output: Array of matching organizational guidelines.`,

  "synthesizer": `You are the Synthesizer Agent. Merge findings from all active inspection agents. Deduplicate warnings that overlap and output a unified, markdown-formatted comment checklist for GitHub.
Output format: { aiDecision: APPROVED/CHANGES_REQUESTED, markdownComment: string }.`,
  "database_agent": `You are the Database Optimization Agent. Audit database queries, JPA/Hibernate mapping definitions, transaction boundaries, and schema migrations for indexing efficiency and safety.`,
  "performance_agent": `You are the Performance Optimization Agent. Scan source code changes for speed bottlenecks, CPU hot paths, inefficient loops, resource leakage, and high memory allocations.`,
  "api_agent": `You are the API Schema Compliance Agent. Review REST/GraphQL endpoints specifications, route path validations, controller request bodies, and output DTO patterns.`,
  "testing_agent": `You are the Testing Assurance Agent. Check test specifications, coverage profiles, assertion robustness, mock structures validity, and edge case assertions.`,
  "devops_agent": `You are the DevOps & Infrastructure Agent. Analyze Dockerfiles, Kubernetes manifests, Helm charts, and CI/CD pipelines configurations for security practices and syntax.`,
  "accessibility_agent": `You are the Accessibility Standard Agent. Verify HTML/CSS styling compliance, ARIA attribute specifications, layout contrasts, and page reader semantics.`,
  "documentation_agent": `You are the Documentation Agent. Scan files changes to ensure Javadocs, docstrings, README references, and swagger guides are updated.`,
  "compliance_agent": `You are the Compliance Agent. Audit codebase modifications to detect GDPR/CCPA storage issues, software license limits, and cryptographical rules compliance.`
}

const middleAgentConfig = [
  { id: "2", label: "Code Quality Analyzer", icon: Zap, keyword: "static" },
  { id: "3", label: "Security Auditor", icon: Shield, keyword: "security" },
  { id: "4", label: "Architecture Auditor", icon: Cpu, keyword: "architecture" },
  { id: "5", label: "Style Auditor", icon: Search, keyword: "style" },
  { id: "8", label: "Database Agent", icon: Database, keyword: "database" },
  { id: "9", label: "Performance Agent", icon: Activity, keyword: "performance" },
  { id: "10", label: "API Agent", icon: Server, keyword: "api" },
  { id: "11", label: "Testing Agent", icon: CheckCircle2, keyword: "testing" },
  { id: "12", label: "DevOps Agent", icon: Settings, keyword: "devops" },
  { id: "13", label: "Accessibility Agent", icon: Brain, keyword: "accessibility" },
  { id: "14", label: "Documentation Agent", icon: Search, keyword: "documentation" },
  { id: "15", label: "Compliance Agent", icon: Shield, keyword: "compliance" }
]

// Mock payloads console for each agent node
const agentConsoleData = {
  "coordinator": {
    input: { pr_number: 104, title: "refactor: optimize DB queries", files: ["db.js", "controller.js"] },
    output: { target_branches: ["main"], active_agents: ["static_analysis", "security_check", "architecture_check", "style_check"] }
  },
  "static_analysis": {
    input: { diff_lines: 124, language: "javascript" },
    output: { complexity_score: 12, violations: [{ line: 42, rule: "Prefer early returns", confidence: 0.95 }] }
  },
  "security_agent": {
    input: { scans: ["secrets", "sql_injection", "xss"] },
    output: { issues: [{ severity: "CRITICAL", description: "Hardcoded credential token detected in config", line: 12 }] }
  },
  "architecture_agent": {
    input: { dependencies: ["db.js -> controller.js"] },
    output: { violations: [], clean_boundaries: true }
  },
  "style_agent": {
    input: { styleRules: ["camelCase", "useSemicolons"] },
    output: { warnings: [{ line: 55, message: "Use camelCase instead of snake_case for get_user_id" }] }
  },
  "rag_retriever": {
    input: { semantic_tokens: ["db queries optimization", "early return"] },
    output: { matched_documents: 3, average_similarity: 0.89 }
  },
  "synthesizer": {
    input: { findings_merged: 2, criticals: 1 },
    output: { aiDecision: "CHANGES_REQUESTED", prCommentUrl: "github.com/pr/104#comments" }
  }
}

export default function AIAgentCenter() {
  const [activeRepo, setActiveRepo] = useState(null)
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })

  // Live reviews and traces states
  const [latestReview, setLatestReview] = useState(null)
  const [latestReviewDetails, setLatestReviewDetails] = useState(null)
  const [liveMode, setLiveMode] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // Graph execution simulation state
  const [simulationActive, setSimulationActive] = useState(false)
  const [showSimulationResult, setShowSimulationResult] = useState(false)
  const [simStep, setSimStep] = useState(-1) // -1: idle, 0: coordinator, 1: agents running, 2: retriever, 3: synthesizer
  const [activeNodeId, setActiveNodeId] = useState(null)
  const [completedNodes, setCompletedNodes] = useState({})
  
  // Selected node detailed view state
  const [selectedNodeId, setSelectedNodeId] = useState("1") // defaults to coordinator
 
   useEffect(() => {
     // Reset simulation state when repository changes
     setSimulationActive(false)
     setShowSimulationResult(false)
     setSimStep(-1)
     setActiveNodeId(null)
     setCompletedNodes({})
 
     if (selectedRepoId) {
       fetchRepositoryDetails(selectedRepoId)
       fetchLatestReview(selectedRepoId)
     } else {
       setActiveRepo(null)
       setLatestReview(null)
       setLatestReviewDetails(null)
       setLiveMode(false)
     }
 
     const handleRepoChange = () => {
       const newRepoId = localStorage.getItem("prsense_selected_repo_id") || ""
       setSelectedRepoId(newRepoId)
       
       // Reset simulation state when repository changes via listener
       setSimulationActive(false)
       setShowSimulationResult(false)
       setSimStep(-1)
       setActiveNodeId(null)
       setCompletedNodes({})

      if (newRepoId) {
        fetchRepositoryDetails(newRepoId)
        fetchLatestReview(newRepoId)
      } else {
        setActiveRepo(null)
        setLatestReview(null)
        setLatestReviewDetails(null)
        setLiveMode(false)
      }
    }

    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [selectedRepoId])

  // Polling loop for live updates
  useEffect(() => {
    let interval
    if (selectedRepoId && !simulationActive) {
      interval = setInterval(() => {
        fetchLatestReview(selectedRepoId)
      }, 4000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [selectedRepoId, simulationActive])

  const fetchRepositoryDetails = async (id) => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE_URL}/api/repositories/${id}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setActiveRepo(data)
      } else {
        setActiveRepo(null)
      }
    } catch (e) {
      console.error("Failed to fetch repository metadata", e)
      setActiveRepo(null)
    }
  }

  const fetchLatestReview = async (repoId) => {
    if (simulationActive) return
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE_URL}/api/analytics/timeline/${repoId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data.timeline && data.timeline.length > 0) {
          const latest = data.timeline[0]
          setLatestReview(latest)
          setLiveMode(true)
          
          const detailsRes = await fetch(`${API_BASE_URL}/api/reviews/${latest.reviewId}`, { headers })
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json()
            setLatestReviewDetails(detailsData)
          } else {
            setLatestReviewDetails(null)
          }
        } else {
          setLatestReview(null)
          setLatestReviewDetails(null)
          setLiveMode(false)
        }
      } else {
        setLatestReview(null)
        setLatestReviewDetails(null)
        setLiveMode(false)
      }
    } catch (e) {
      console.error("Failed to fetch latest review data", e)
      setLatestReview(null)
      setLatestReviewDetails(null)
      setLiveMode(false)
    }
  }

  const getLiveNodeData = (nodeId) => {
    if (!liveMode || !latestReviewDetails) {
      return { completed: false, isProcessing: false, isFailed: false, latency: "N/A", cost: 0.0, confidence: 0.85 }
    }
    
    const status = latestReviewDetails.review.status // PENDING, IN_PROGRESS, COMPLETED, FAILED
    const agentOutputs = latestReviewDetails.agentOutputs || []
    const timeline = latestReviewDetails.timeline || []
    
    let matchAo = null
    let categoryKey = ""
    if (nodeId === "1") categoryKey = "coordinator"
    else if (nodeId === "2") categoryKey = "static"
    else if (nodeId === "3") categoryKey = "security"
    else if (nodeId === "4") categoryKey = "architecture"
    else if (nodeId === "5") categoryKey = "style"
    else if (nodeId === "6") categoryKey = "retriever"
    else if (nodeId === "7") categoryKey = "synthesizer"
    else if (nodeId === "8") categoryKey = "database"
    else if (nodeId === "9") categoryKey = "performance"
    else if (nodeId === "10") categoryKey = "api"
    else if (nodeId === "11") categoryKey = "testing"
    else if (nodeId === "12") categoryKey = "devops"
    else if (nodeId === "13") categoryKey = "accessibility"
    else if (nodeId === "14") categoryKey = "documentation"
    else if (nodeId === "15") categoryKey = "compliance"
    
    if (categoryKey) {
      matchAo = agentOutputs.find(ao => ao.agentName.toLowerCase().includes(categoryKey))
    }
    
    let matchTl = null
    if (nodeId === "1") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("prepare") || t.stepName.toLowerCase().includes("coordinator"))
    } else if (nodeId === "2") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("static"))
    } else if (nodeId === "3") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("security"))
    } else if (nodeId === "4") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("architecture"))
    } else if (nodeId === "5") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("style"))
    } else if (nodeId === "6") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("semantic search") || t.stepName.toLowerCase().includes("retriev"))
    } else if (nodeId === "7") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("synthesiz") || t.stepName.toLowerCase().includes("summary"))
    } else if (nodeId === "8") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("database"))
    } else if (nodeId === "9") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("performance"))
    } else if (nodeId === "10") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("api"))
    } else if (nodeId === "11") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("testing"))
    } else if (nodeId === "12") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("devops"))
    } else if (nodeId === "13") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("accessibility"))
    } else if (nodeId === "14") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("documentation"))
    } else if (nodeId === "15") {
      matchTl = timeline.find(t => t.stepName.toLowerCase().includes("compliance"))
    }
    
    let completed = false
    let isProcessing = false
    let isFailed = false
    
    if (matchAo || matchTl) {
      completed = (matchAo && matchAo.id) || (matchTl && matchTl.status === "COMPLETED")
      isProcessing = matchTl && matchTl.status === "IN_PROGRESS"
      isFailed = (matchTl && matchTl.status === "FAILED")
    } else {
      if (status === "COMPLETED") {
        completed = false
      } else if (status === "FAILED") {
        isFailed = true
      } else if (status === "IN_PROGRESS" || status === "PENDING") {
        if (nodeId === "1") isProcessing = true
        else if (["2", "3", "4", "5", "6"].includes(nodeId)) {
          const preparePrDone = timeline.some(t => t.stepName.toLowerCase().includes("prepare") && t.status === "COMPLETED")
          if (preparePrDone) isProcessing = true
        } else if (nodeId === "7") {
          const parallelDone = timeline.some(t => t.stepName.toLowerCase().includes("static") && t.status === "COMPLETED")
          if (parallelDone) isProcessing = true
        }
      }
    }
    
    const latency = matchAo ? `${matchAo.durationMs}ms` : matchTl ? `${matchTl.durationMs}ms` : "N/A"
    const cost = matchAo ? matchAo.cost : matchTl ? matchTl.cost : 0.0
    const confidence = matchAo ? matchAo.confidence : 0.85
    
    return {
      completed,
      isProcessing,
      isFailed,
      latency,
      cost,
      confidence
    }
  }

  const getLiveConsoleData = (key) => {
    if (!liveMode || !latestReviewDetails) return null
    const agentOutputs = latestReviewDetails.agentOutputs || []
    
    let categoryKey = ""
    if (key === "coordinator") categoryKey = "coordinator"
    else if (key === "static_analysis") categoryKey = "static"
    else if (key === "security_agent") categoryKey = "security"
    else if (key === "architecture_agent") categoryKey = "architecture"
    else if (key === "style_agent") categoryKey = "style"
    else if (key === "synthesizer") categoryKey = "synthesizer"
    else if (key === "database_agent") categoryKey = "database"
    else if (key === "performance_agent") categoryKey = "performance"
    else if (key === "api_agent") categoryKey = "api"
    else if (key === "testing_agent") categoryKey = "testing"
    else if (key === "devops_agent") categoryKey = "devops"
    else if (key === "accessibility_agent") categoryKey = "accessibility"
    else if (key === "documentation_agent") categoryKey = "documentation"
    else if (key === "compliance_agent") categoryKey = "compliance"
    
    let matchAo = agentOutputs.find(ao => ao.agentName.toLowerCase().includes(categoryKey))
    
    if (!matchAo && key === "rag_retriever") {
      return {
        input: `Querying pgvector vector embeddings database for context matching repository codebase rules:\n${latestReviewDetails.pullRequest?.title || "Active pull request"}`,
        output: latestReviewDetails.review.summaryReport ? "Successfully retrieved similarity context from pgvector database." : "No Semantic Search context index matches found."
      }
    }
    
    if (!matchAo) return null
    
    return {
      input: matchAo.prompt,
      output: matchAo.response
    }
  }

  const getSimulatedConsoleData = (key) => {
    const repoName = activeRepo ? activeRepo.name : "test-repo";
    const repoFullName = activeRepo ? activeRepo.fullName : "ansh/test-repo";
    const repoLang = (activeRepo && activeRepo.language) ? activeRepo.language.toLowerCase() : "javascript";
    const repoDefaultBranch = activeRepo ? activeRepo.defaultBranch : "main";
    
    // Choose file extensions based on language
    let ext = "js";
    if (repoLang.includes("java")) ext = "java";
    else if (repoLang.includes("python")) ext = "py";
    else if (repoLang.includes("go")) ext = "go";
    else if (repoLang.includes("rust")) ext = "rs";
    else if (repoLang.includes("typescript") || repoLang.includes("ts")) ext = "ts";
    else if (repoLang.includes("c++") || repoLang.includes("cpp")) ext = "cpp";
    
    // Capitalized language name
    const langName = repoLang.charAt(0).toUpperCase() + repoLang.slice(1);
    
    // Generate file list
    const file1 = `src/services/DatabaseService.${ext}`;
    const file2 = `src/controllers/AnalyticsController.${ext}`;
    
    switch (key) {
      case "coordinator":
        return {
          input: { 
            pr_number: 104, 
            title: "refactor: optimize DB queries and memory allocations", 
            files: [file1, file2],
            repository: repoFullName
          },
          output: { 
            target_branch: repoDefaultBranch, 
            active_agents: ["static_analysis", "security_agent", "architecture_agent", "style_agent", "database_agent"] 
          }
        };
      case "static_analysis":
        return {
          input: { 
            diff_lines: 124, 
            language: repoLang,
            files_scanned: [file1, file2]
          },
          output: { 
            complexity_score: 12, 
            violations: [
              { line: 42, file: file2, rule: "Prefer early returns over nested blocks", confidence: 0.95 }
            ] 
          }
        };
      case "security_agent":
        return {
          input: { 
            scans: ["secrets", "sql_injection", "xss", "csrf"],
            language: repoLang,
            files: [file1]
          },
          output: { 
            issues: [
              { severity: "CRITICAL", file: file1, description: `Hardcoded API token pattern detected in ${file1}`, line: 12 }
            ] 
          }
        };
      case "architecture_agent":
        return {
          input: { 
            dependencies: [`${file2} -> ${file1}`],
            repository: repoFullName
          },
          output: { 
            violations: [], 
            clean_boundaries: true,
            notes: `Architecture boundaries verified: controllers use services in ${repoName}.`
          }
        };
      case "style_agent":
        return {
          input: { 
            styleRules: ["camelCase", "useSemicolons", "maxLineLength"],
            language: repoLang
          },
          output: { 
            warnings: [
              { line: 55, file: file2, message: `Use camelCase instead of snake_case in ${langName} codebase` }
            ] 
          }
        };
      case "database_agent":
        return {
          input: { 
            scans: ["unindexed_searches", "slow_joins", "locking_migrations"],
            language: repoLang,
            files: [file1]
          },
          output: { 
            recommendation: "Add index to repository queries to avoid full table scans.",
            confidence: 0.92
          }
        };
      case "performance_agent":
        return {
          input: { 
            scans: ["loops_inefficiency", "memory_leaks", "bottlenecks"],
            language: repoLang
          },
          output: { 
            recommendation: "Cache query results in redis instead of querying database inside the loop.",
            confidence: 0.88
          }
        };
      case "api_agent":
        return {
          input: { 
            endpoints: [`POST /api/${repoName}/query`],
            language: repoLang
          },
          output: { 
            recommendation: "Validate request body fields explicitly on route handler entry.",
            confidence: 0.94
          }
        };
      case "testing_agent":
        return {
          input: { 
            test_files: [`src/test/DatabaseServiceTest.${ext}`]
          },
          output: { 
            recommendation: "Add assertion verifying exception handling logic on connection failures.",
            confidence: 0.91
          }
        };
      case "devops_agent":
        return {
          input: { 
            files: ["Dockerfile", ".github/workflows/deploy.yml"]
          },
          output: { 
            recommendation: "Avoid running container as root. Use a non-privileged user instead.",
            confidence: 0.95
          }
        };
      case "accessibility_agent":
        return {
          input: { 
            files: ["src/components/button.jsx"]
          },
          output: { 
            recommendation: "Add aria-label attribute to interactive buttons lacking text content.",
            confidence: 0.89
          }
        };
      case "documentation_agent":
        return {
          input: { 
            files: [file2]
          },
          output: { 
            recommendation: "Update Swagger/OpenAPI description annotations to match changed model fields.",
            confidence: 0.9
          }
        };
      case "compliance_agent":
        return {
          input: { 
            files: [file1]
          },
          output: { 
            recommendation: "Verify user data storage matches GDPR deletion/retention requirements.",
            confidence: 0.93
          }
        };
      case "rag_retriever":
        return {
          input: { 
            semantic_tokens: ["db queries optimization", "early return", "secrets configuration"],
            repo_scope: repoFullName
          },
          output: { 
            matched_documents: 3, 
            average_similarity: 0.89,
            contexts_retrieved: [
              `Rule: Database connections must use pooled connections in ${repoName}.`,
              "Guideline: Never commit API credentials to source repositories."
            ]
          }
        };
      case "synthesizer":
        return {
          input: { 
            findings_merged: 2, 
            criticals: 1,
            warnings: 1,
            repo_fullName: repoFullName
          },
          output: { 
            aiDecision: "CHANGES_REQUESTED", 
            prCommentUrl: `github.com/${repoFullName}/pull/104#issuecomment-992138` 
          }
        };
      default:
        return null;
    }
  }

  // Simulation pipeline sequence
  const startSimulation = () => {
    if (simulationActive) return
    setSimulationActive(true)
    setShowSimulationResult(true)
    setCompletedNodes({})
    setSimStep(0)
  }

  useEffect(() => {
    if (!simulationActive) return

    let timer
    if (simStep === 0) {
      setActiveNodeId("1")
      timer = setTimeout(() => {
        setCompletedNodes(prev => ({ ...prev, "1": true }))
        setSimStep(1)
      }, 1800)
    } else if (simStep === 1) {
      setActiveNodeId("parallel")
      timer = setTimeout(() => {
        setCompletedNodes(prev => ({ ...prev, "2": true, "3": true, "4": true, "5": true }))
        setSimStep(2)
      }, 2500)
    } else if (simStep === 2) {
      setActiveNodeId("6")
      timer = setTimeout(() => {
        setCompletedNodes(prev => ({ ...prev, "6": true }))
        setSimStep(3)
      }, 1500)
    } else if (simStep === 3) {
      setActiveNodeId("7")
      timer = setTimeout(() => {
        setCompletedNodes(prev => ({ ...prev, "7": true }))
        setSimulationActive(false)
        setActiveNodeId(null)
        setSimStep(-1)
      }, 2000)
    }

    return () => clearTimeout(timer)
  }, [simulationActive, simStep])

  const resetSimulation = () => {
    setSimulationActive(false)
    setShowSimulationResult(false)
    setSimStep(-1)
    setActiveNodeId(null)
    setCompletedNodes({})
  }

  // Define graph layout nodes dynamically based on active/completed states
  const getNodes = () => {
    if (simulationActive || showSimulationResult || !liveMode || !latestReviewDetails) {
      return [
        { 
          id: '1', 
          type: 'agent', 
          position: { x: 380, y: 15 }, 
          data: { 
            id: '1',
            label: 'Coordinator Agent', 
            icon: Brain, 
            latency: '80ms', 
            cost: 0.00012, 
            completed: completedNodes["1"], 
            activeNodeId: activeNodeId === "1" ? "1" : null,
            selectedNodeId,
            inputPosition: "none",
            outputPosition: Position.Bottom
          } 
        },
        { 
          id: '2', 
          type: 'agent', 
          position: { x: 30, y: 170 }, 
          data: { 
            id: '2',
            label: 'Code Quality Analyzer', 
            icon: Zap, 
            latency: '480ms', 
            cost: 0.00036, 
            completed: completedNodes["2"], 
            activeNodeId: activeNodeId === "parallel" ? "2" : null,
            selectedNodeId,
            inputPosition: Position.Top,
            outputPosition: Position.Bottom
          } 
        },
        { 
          id: '3', 
          type: 'agent', 
          position: { x: 260, y: 170 }, 
          data: { 
            id: '3',
            label: 'Security Auditor', 
            icon: Shield, 
            latency: '720ms', 
            cost: 0.00045, 
            completed: completedNodes["3"], 
            activeNodeId: activeNodeId === "parallel" ? "3" : null,
            selectedNodeId,
            inputPosition: Position.Top,
            outputPosition: Position.Bottom
          } 
        },
        { 
          id: '4', 
          type: 'agent', 
          position: { x: 490, y: 170 }, 
          data: { 
            id: '4',
            label: 'Architecture Auditor', 
            icon: Cpu, 
            latency: '510ms', 
            cost: 0.00041, 
            completed: completedNodes["4"], 
            activeNodeId: activeNodeId === "parallel" ? "4" : null,
            selectedNodeId,
            inputPosition: Position.Top,
            outputPosition: Position.Bottom
          } 
        },
        { 
          id: '5', 
          type: 'agent', 
          position: { x: 720, y: 170 }, 
          data: { 
            id: '5',
            label: 'Style Auditor', 
            icon: Search, 
            latency: '630ms', 
            cost: 0.00032, 
            completed: completedNodes["5"], 
            activeNodeId: activeNodeId === "parallel" ? "5" : null,
            selectedNodeId,
            inputPosition: Position.Top,
            outputPosition: Position.Bottom
          } 
        },
        { 
          id: '6', 
          type: 'agent', 
          position: { x: 380, y: 320 }, 
          data: { 
            id: '6',
            label: 'Semantic Search Context Retriever', 
            icon: Database, 
            latency: '150ms', 
            cost: 0.00018, 
            completed: completedNodes["6"], 
            activeNodeId: activeNodeId === "6" ? "6" : null,
            selectedNodeId,
            inputPosition: Position.Top,
            outputPosition: Position.Bottom
          } 
        },
        { 
          id: '7', 
          type: 'agent', 
          position: { x: 380, y: 465 }, 
          data: { 
            id: '7',
            label: 'Synthesizer Agent', 
            icon: PenTool, 
            latency: '310ms', 
            cost: 0.00052, 
            completed: completedNodes["7"], 
            activeNodeId: activeNodeId === "7" ? "7" : null,
            selectedNodeId,
            inputPosition: Position.Top,
            outputPosition: "none"
          } 
        }
      ]
    }
    
    const agentOutputs = latestReviewDetails.agentOutputs || []
    const timeline = latestReviewDetails.timeline || []

    const hasAgent = (nameKeyword) => {
      return agentOutputs.some(ao => ao.agentName.toLowerCase().includes(nameKeyword)) ||
             timeline.some(t => t.stepName.toLowerCase().includes(nameKeyword))
    }

    const activeMiddleAgents = middleAgentConfig.filter(cfg => hasAgent(cfg.keyword))
    const activeMiddleAgentIds = activeMiddleAgents.map(cfg => cfg.id)
    const hasRAG = hasAgent("semantic search") || hasAgent("retriev")

    const middleCount = activeMiddleAgents.length
    const spacing = middleCount > 1 ? 690 / (middleCount - 1) : 0
    const startX = middleCount === 1 ? 380 : 30

    const yRAG = 320
    const ySynthesizer = hasRAG ? 465 : 320

    const nodes = [
      { 
        id: '1', 
        type: 'agent', 
        position: { x: 380, y: 15 }, 
        data: { 
          id: '1',
          label: 'Coordinator Agent', 
          icon: Brain, 
          latency: getLiveNodeData("1").latency, 
          cost: getLiveNodeData("1").cost, 
          completed: getLiveNodeData("1").completed, 
          activeNodeId: getLiveNodeData("1").isProcessing ? "1" : null,
          isFailed: getLiveNodeData("1").isFailed,
          selectedNodeId,
          inputPosition: "none",
          outputPosition: Position.Bottom
        } 
      }
    ]

    activeMiddleAgents.forEach((cfg, index) => {
      const xPos = middleCount === 1 ? 380 : (startX + index * spacing)
      nodes.push({
        id: cfg.id,
        type: 'agent',
        position: { x: xPos, y: 170 },
        data: {
          id: cfg.id,
          label: cfg.label,
          icon: cfg.icon,
          latency: getLiveNodeData(cfg.id).latency,
          cost: getLiveNodeData(cfg.id).cost,
          completed: getLiveNodeData(cfg.id).completed,
          activeNodeId: getLiveNodeData(cfg.id).isProcessing ? cfg.id : null,
          isFailed: getLiveNodeData(cfg.id).isFailed,
          selectedNodeId,
          inputPosition: Position.Top,
          outputPosition: Position.Bottom
        }
      })
    })

    if (hasRAG) {
      nodes.push({
        id: '6',
        type: 'agent',
        position: { x: 380, y: yRAG },
        data: {
          id: '6',
          label: 'Semantic Search Context Retriever',
          icon: Database,
          latency: getLiveNodeData("6").latency,
          cost: getLiveNodeData("6").cost,
          completed: getLiveNodeData("6").completed,
          activeNodeId: getLiveNodeData("6").isProcessing ? "6" : null,
          isFailed: getLiveNodeData("6").isFailed,
          selectedNodeId,
          inputPosition: Position.Top,
          outputPosition: Position.Bottom
        }
      })
    }

    nodes.push({
      id: '7',
      type: 'agent',
      position: { x: 380, y: ySynthesizer },
      data: {
        id: '7',
        label: 'Synthesizer Agent',
        icon: PenTool,
        latency: getLiveNodeData("7").latency,
        cost: getLiveNodeData("7").cost,
        completed: getLiveNodeData("7").completed,
        activeNodeId: getLiveNodeData("7").isProcessing ? "7" : null,
        isFailed: getLiveNodeData("7").isFailed,
        selectedNodeId,
        inputPosition: Position.Top,
        outputPosition: "none"
      }
    })

    return nodes
  }

  // Setup animated flows between nodes based on simulation
  const getEdges = () => {
    if (simulationActive || showSimulationResult || !liveMode || !latestReviewDetails) {
      return [
        { 
          id: 'e1-2', source: '1', target: '2', 
          animated: activeNodeId === "1" || activeNodeId === "parallel", 
          style: { stroke: activeNodeId === "1" || completedNodes["2"] ? '#ff5a1f' : '#27272a', strokeWidth: 2 } 
        },
        { 
          id: 'e1-3', source: '1', target: '3', 
          animated: activeNodeId === "1" || activeNodeId === "parallel", 
          style: { stroke: activeNodeId === "1" || completedNodes["3"] ? '#ff5a1f' : '#27272a', strokeWidth: 2 } 
        },
        { 
          id: 'e1-4', source: '1', target: '4', 
          animated: activeNodeId === "1" || activeNodeId === "parallel", 
          style: { stroke: activeNodeId === "1" || completedNodes["4"] ? '#ff5a1f' : '#27272a', strokeWidth: 2 } 
        },
        { 
          id: 'e1-5', source: '1', target: '5', 
          animated: activeNodeId === "1" || activeNodeId === "parallel", 
          style: { stroke: activeNodeId === "1" || completedNodes["5"] ? '#ff5a1f' : '#27272a', strokeWidth: 2 } 
        },
        
        { 
          id: 'e2-6', source: '2', target: '6', 
          animated: activeNodeId === "parallel" || activeNodeId === "6", 
          style: { stroke: completedNodes["2"] ? '#ff5a1f' : '#27272a', strokeWidth: 1.5 } 
        },
        { 
          id: 'e3-6', source: '3', target: '6', 
          animated: activeNodeId === "parallel" || activeNodeId === "6", 
          style: { stroke: completedNodes["3"] ? '#ff5a1f' : '#27272a', strokeWidth: 1.5 } 
        },
        { 
          id: 'e4-6', source: '4', target: '6', 
          animated: activeNodeId === "parallel" || activeNodeId === "6", 
          style: { stroke: completedNodes["4"] ? '#ff5a1f' : '#27272a', strokeWidth: 1.5 } 
        },
        { 
          id: 'e5-6', source: '5', target: '6', 
          animated: activeNodeId === "parallel" || activeNodeId === "6", 
          style: { stroke: completedNodes["5"] ? '#ff5a1f' : '#27272a', strokeWidth: 1.5 } 
        },

        { 
          id: 'e6-7', source: '6', target: '7', 
          animated: activeNodeId === "6" || activeNodeId === "7", 
          style: { stroke: completedNodes["6"] ? '#ff5a1f' : '#27272a', strokeWidth: 2 } 
        },
      ]
    }

    const agentOutputs = latestReviewDetails.agentOutputs || []
    const timeline = latestReviewDetails.timeline || []

    const hasAgent = (nameKeyword) => {
      return agentOutputs.some(ao => ao.agentName.toLowerCase().includes(nameKeyword)) ||
             timeline.some(t => t.stepName.toLowerCase().includes(nameKeyword))
    }

    const activeMiddleAgents = middleAgentConfig.filter(cfg => hasAgent(cfg.keyword))
    const activeMiddleAgentIds = activeMiddleAgents.map(cfg => cfg.id)
    const hasRAG = hasAgent("semantic search") || hasAgent("retriev")

    const edges = []

    activeMiddleAgentIds.forEach(id => {
      edges.push({
        id: `e1-${id}`,
        source: '1',
        target: id,
        animated: getLiveNodeData("1").isProcessing || getLiveNodeData(id).isProcessing,
        style: { 
          stroke: getLiveNodeData("1").completed || getLiveNodeData(id).completed ? '#ff5a1f' : '#27272a', 
          strokeWidth: 2 
        }
      })
    })

    const nextNodeId = hasRAG ? '6' : '7'
    activeMiddleAgentIds.forEach(id => {
      edges.push({
        id: `e${id}-${nextNodeId}`,
        source: id,
        target: nextNodeId,
        animated: getLiveNodeData(id).isProcessing || getLiveNodeData(nextNodeId).isProcessing,
        style: { 
          stroke: getLiveNodeData(id).completed ? '#ff5a1f' : '#27272a', 
          strokeWidth: 1.5 
        }
      })
    })

    if (hasRAG) {
      edges.push({
        id: 'e6-7',
        source: '6',
        target: '7',
        animated: getLiveNodeData("6").isProcessing || getLiveNodeData("7").isProcessing,
        style: { 
          stroke: getLiveNodeData("6").completed ? '#ff5a1f' : '#27272a', 
          strokeWidth: 2 
        }
      })
    }

    return edges
  }

  const onNodeClick = (event, node) => {
    setSelectedNodeId(node.id)
  }

  const getNodeDetails = (id) => {
    const keyMap = {
      "1": { name: "Coordinator Agent", key: "coordinator", model: "Claude 3.5 Sonnet", temp: "0.1" },
      "2": { name: "Code Quality Analyzer", key: "static_analysis", model: "GPT-4o-mini", temp: "0.2" },
      "3": { name: "Security Check Agent", key: "security_agent", model: "Claude 3.5 Sonnet", temp: "0.0" },
      "4": { name: "Architecture Boundary Agent", key: "architecture_agent", model: "GPT-4o-mini", temp: "0.1" },
      "5": { name: "Style Standard Agent", key: "style_agent", model: "GPT-4o-mini", temp: "0.2" },
      "6": { name: "Semantic Search Context Retriever", key: "rag_retriever", model: "pgvector Index Search", temp: "N/A" },
      "7": { name: "Synthesizer Agent", key: "synthesizer", model: "Claude 3.5 Sonnet", temp: "0.3" },
      "8": { name: "Database Agent", key: "database_agent", model: "GPT-4o-mini", temp: "0.1" },
      "9": { name: "Performance Agent", key: "performance_agent", model: "GPT-4o-mini", temp: "0.2" },
      "10": { name: "API Agent", key: "api_agent", model: "GPT-4o-mini", temp: "0.1" },
      "11": { name: "Testing Agent", key: "testing_agent", model: "GPT-4o-mini", temp: "0.2" },
      "12": { name: "DevOps Agent", key: "devops_agent", model: "GPT-4o-mini", temp: "0.1" },
      "13": { name: "Accessibility Agent", key: "accessibility_agent", model: "GPT-4o-mini", temp: "0.2" },
      "14": { name: "Documentation Agent", key: "documentation_agent", model: "GPT-4o-mini", temp: "0.1" },
      "15": { name: "Compliance Agent", key: "compliance_agent", model: "GPT-4o-mini", temp: "0.2" }
    }
    return keyMap[id] || keyMap["1"]
  }

  const currentDetails = getNodeDetails(selectedNodeId)

  return (
    <div className="h-full flex flex-col p-6 space-y-6 bg-[#0c0c0e] animate-in fade-in duration-500 min-h-screen">
      
      {/* Background radial highlights */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#ff5a1f]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-905 pb-5 shrink-0 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 rounded-xl">
              <Cpu className="text-[#ff5a1f] w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Workflow Engine Studio Topology
              </h1>
              <p className="text-slate-450 text-xs mt-0.5">
                Live StateGraph multi-stage network router mapping inputs, parallel checkpoints, and deduplicated outputs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeRepo && (
            <div className="bg-slate-900/60 border border-slate-900 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-sm mr-2 text-slate-400">
              Scope: <span className="text-[#ff5a1f]">{activeRepo.fullName}</span>
            </div>
          )}

          <div className="flex gap-2 bg-[#09090b] border border-slate-900 p-1 rounded-xl">
            <button
              onClick={startSimulation}
              disabled={simulationActive}
              className="px-3.5 py-1.5 bg-[#ff5a1f]/10 hover:bg-[#ff5a1f]/20 disabled:bg-transparent text-[#ff5a1f] disabled:text-slate-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Simulate Run
            </button>
            <button
              onClick={resetSimulation}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Reset state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {!activeRepo ? (
        <div className="flex-1 border border-dashed border-slate-900 rounded-2xl flex flex-col justify-center items-center text-center p-8 space-y-4 bg-slate-950/20 backdrop-blur-md relative z-10">
          <div className="p-4 bg-slate-950 border border-slate-900 rounded-full inline-block">
            <AlertCircle className="w-10 h-10 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Active Repository</h3>
            <p className="text-slate-450 text-sm max-w-sm">
              Please select a repository in the sidebar picker to visual the Workflow Engine state machine structure.
            </p>
          </div>
        </div>
      ) : (!latestReview && !simulationActive && !showSimulationResult) ? (
        <div className="flex-1 border border-dashed border-slate-900 rounded-2xl flex flex-col justify-center items-center text-center p-8 space-y-4 bg-slate-950/20 backdrop-blur-md relative z-10">
          <div className="p-4 bg-slate-950 border border-slate-900 rounded-full inline-block">
            <Clock className="w-10 h-10 text-[#ff5a1f] animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Waiting for First Review</h3>
            <p className="text-slate-450 text-sm max-w-sm">
              No reviews have been run on this repository yet. Push code or open a Pull Request on GitHub to trigger the multi-stage review workflow, or click "Simulate Run" above to see the flow.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[580px] relative z-10">
          
          {/* Flow Graph View (8 cols) */}
          <div className="lg:col-span-8 h-full flex flex-col overflow-hidden border border-slate-900 bg-slate-950/40 rounded-2xl relative min-h-[550px]">
            <div className="absolute top-4 left-4 z-10 bg-[#09090b] border border-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-extrabold text-slate-300 flex items-center gap-2 backdrop-blur-md">
              <span className={`w-2.5 h-2.5 rounded-full ${simulationActive ? "bg-[#ff5a1f] animate-pulse" : "bg-emerald-500"}`} />
              {simulationActive ? `Simulation State: Step ${simStep + 1}/4` : `Active Trace: PR #${latestReview?.prNumber || "unknown"}`}
            </div>
            
            <div className="flex-1 relative h-full">
              <ReactFlow
                nodes={getNodes()}
                edges={getEdges()}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
                className="bg-[radial-gradient(#1f1f29_1px,transparent_1px)] [background-size:24px_24px]"
              >
                <Background color="rgba(255, 90, 31, 0.02)" gap={16} />
                <Controls className="!bg-slate-900 !border-slate-800 !fill-slate-400 !rounded-lg" />
              </ReactFlow>
            </div>
          </div>
 
          {/* Trace Logs & Prompt detail Panel (4 cols) */}
          <div className="lg:col-span-4 h-full flex flex-col space-y-6">
            
            {/* Detail info container */}
            <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col h-full space-y-4">
              <div className="flex justify-between items-start border-b border-slate-900 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-white">{currentDetails.name}</h3>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 font-semibold">
                    <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono border border-slate-850">
                      {currentDetails.model}
                    </span>
                    {currentDetails.temp !== "N/A" && (
                      <span>Temp: {currentDetails.temp}</span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f] rounded-lg">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
              </div>
 
              {/* Prompt template segment */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  System Instruction Prompt
                </span>
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-350 font-mono leading-relaxed max-h-[160px] overflow-y-auto">
                  {agentPrompts[currentDetails.key]}
                </div>
              </div>
 
              {/* Live console state payloads */}
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider flex items-center gap-1 shrink-0">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  Telemetry Node Payload
                </span>
                <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3.5 font-mono text-[10px] text-slate-350 overflow-y-auto leading-relaxed">
                  <div className="space-y-3">
                    {liveMode && getLiveConsoleData(currentDetails.key) ? (
                      <>
                        <div>
                          <span className="text-orange-400 font-bold">// Node Inputs (Real Prompt)</span>
                          <pre className="mt-1 text-slate-450 pl-2 whitespace-pre-wrap select-all max-h-40 overflow-y-auto">
                            {getLiveConsoleData(currentDetails.key).input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-bold">// Node Outputs (Real Response)</span>
                          <pre className="mt-1 text-slate-400 pl-2 whitespace-pre-wrap select-all max-h-48 overflow-y-auto">
                            {getLiveConsoleData(currentDetails.key).output}
                          </pre>
                        </div>
                      </>
                    ) : (!simulationActive && liveMode) ? (
                      <>
                        <div>
                          <span className="text-orange-400 font-bold">// Node Inputs</span>
                          <pre className="mt-1 text-slate-500 pl-2 italic">
                            No prompt input telemetry recorded for this node in this trace.
                          </pre>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-bold">// Node Outputs</span>
                          <pre className="mt-1 text-slate-500 pl-2 italic">
                            No response output telemetry recorded for this node in this trace.
                          </pre>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-orange-400 font-bold">// Node Inputs</span>
                          <pre className="mt-1 text-slate-450 pl-2">
                            {JSON.stringify(getSimulatedConsoleData(currentDetails.key)?.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-bold">// Node Outputs</span>
                          <pre className="mt-1 text-slate-450 pl-2">
                            {JSON.stringify(getSimulatedConsoleData(currentDetails.key)?.output, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Micro workflow helper info */}
            <div className="bg-slate-950/35 border border-slate-900 rounded-xl p-4 text-xs text-slate-450 space-y-2">
              <div className="font-extrabold text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                StateGraph Orchestration
              </div>
              <p className="leading-normal font-medium">
                PRSense uses a compiled cyclical StateGraph. Clicking on nodes updates the telemetry console above. Triggering a simulation shows data passing through checking checks.
              </p>
            </div>

          </div>

        </div>
      )}
    </div>
  )
}
