import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  Shield,
  Zap,
  GitBranch,
  MessageSquare,
  BarChart3,
  Play,
  Check,
  ChevronDown,
  Lock,
  Cpu,
  Layers,
  Search,
  Code,
  Brain,
  Database,
  Terminal,
  Activity,
  Server,
  Star,
  RefreshCw,
  GitPullRequest,
  CheckSquare,
  Clock,
  Settings,
  HelpCircle,
  Eye,
  Workflow
} from "lucide-react"

// CodeRabbit Circular White-Rabbit Logo Custom component re-themed back to brand orange
const CodeRabbitLogo = ({ className = "w-8 h-8" }) => (
  <div className={cn("rounded-full bg-[#ff5a1f] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0", className)}>
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
      <path d="M12 9c-2.8 0-5 2.2-5 5v3c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4v-3c0-2.8-2.2-5-5-5zm-2.5-7c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1zm5 0c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1z" />
    </svg>
  </div>
)

const GithubLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57V21.09c-3.33.72-4.035-1.605-4.035-1.605-.54-1.38-1.335-1.755-1.335-1.755-1.095-.75.09-.735.09-.735 1.215.09 1.86 1.245 1.86 1.245 1.08 1.83 2.82 1.305 3.51.99.105-.78.42-1.305.765-1.605-2.655-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22v3.3c0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const GitLabLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <path d="M23.953 11.859l-1.01-3.111L19.26.828c-.139-.427-.741-.427-.88 0l-3.683 11.33H9.288L5.606.828c-.139-.427-.74-.427-.88 0L1.042 8.748.032 11.859c-.143.439.01.921.378 1.189l11.196 8.136c.237.172.553.172.79 0l11.196-8.136c.367-.268.52-.75.378-1.189" />
  </svg>
)

const BitbucketLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <path d="M22.35 3h-20.7A1.65 1.65 0 0 0 0 4.65v14.7A1.65 1.65 0 0 0 1.65 21h20.7A1.65 1.65 0 0 0 24 19.35V4.65A1.65 1.65 0 0 0 22.35 3zm-7.65 12.6H9.3l-1.35-6.6h8.1z" />
  </svg>
)

export default function LandingPagePremium() {
  const [activeTab, setActiveTab] = useState("security")
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])
  const [simStep, setSimStep] = useState(0) // Sandbox step
  const [archStep, setArchStep] = useState(0) // Architecture step
  const [demoView, setDemoView] = useState("repository") // Product demo step
  
  // Real-time hero agent simulation variables
  const [tokensCount, setTokensCount] = useState(12840)
  const [costCount, setCostCount] = useState(0.0256)
  const [activeAgentNode, setActiveAgentNode] = useState("retriever")
  const [feedLogs, setFeedLogs] = useState([
    "💡 Repository sync verified: master branch clone initiated.",
    "🔍 pgvector search active: matching codebase style profiles..."
  ])

  // Generate background sparkles/particles once with Framer Motion positioning
  useEffect(() => {
    const items = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 4
    }))
    setParticles(items)
  }, [])

  // Track Mouse Position for Live Spotlight Glowing Background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Auto-run sandbox simulator
  useEffect(() => {
    setSimStep(0)
    const timers = [
      setTimeout(() => setSimStep(1), 300),
      setTimeout(() => setSimStep(2), 1200),
      setTimeout(() => setSimStep(3), 2800),
      setTimeout(() => setSimStep(4), 4800)
    ]
    return () => timers.forEach(t => clearTimeout(t))
  }, [activeTab])

  // Hero Multi-Stage Flow real-time simulation tickers
  useEffect(() => {
    const logPool = [
      "🛡️ Security Auditor: Scanning cryptographic parameters in webhook handler...",
      "🏛️ Architecture Auditor: Checking boundary interface imports...",
      "💅 Style Auditor: Auditing camelCase conventions on variables...",
      "⚙️ Static Agent: Inspecting imports overhead & complexity dials...",
      "🤖 Synthesizer: Merging logs and formatting review checklist markdown...",
      "🚀 Webhook: Sending review results payload back to Spring Boot...",
      "📝 GitHub: Inline feedback comments created on pull request..."
    ]

    const interval = setInterval(() => {
      const nodes = ["retriever", "static", "security", "architecture", "style", "synthesizer", "github"]
      const currentIdx = nodes.indexOf(activeAgentNode)
      const nextNode = nodes[(currentIdx + 1) % nodes.length]
      setActiveAgentNode(nextNode)

      // Increment tokens & costs
      setTokensCount(prev => prev + Math.floor(Math.random() * 450 + 120))
      setCostCount(prev => prev + 0.0008 + (Math.random() * 0.0012))

      // Update feed logs
      const nextLog = logPool[Math.floor(Math.random() * logPool.length)]
      setFeedLogs(prev => [nextLog, prev[0]].slice(0, 4))
    }, 3200)

    return () => clearInterval(interval)
  }, [activeAgentNode])

  // Auto-scroll Product Demo Section viewport tabs
  useEffect(() => {
    const views = ["repository", "review", "agent", "timeline", "monitoring"]
    const interval = setInterval(() => {
      const currentIdx = views.indexOf(demoView)
      const nextView = views[(currentIdx + 1) % views.length]
      setDemoView(nextView)
    }, 4500)

    return () => clearInterval(interval)
  }, [demoView])

  const mockDiffs = {
    security: {
      fileName: "src/main/java/com/prsense/backend/service/GitHubService.java",
      linesChanged: "+1 -1",
      diffDel: 'String apiToken = "sk-live-5a89fbcd0012bcfe349a88ad";',
      diffAdd: 'String apiToken = System.getenv("GITHUB_APP_SECRET_TOKEN");',
      agent: "Security Auditor",
      severity: "critical",
      confidence: "99%",
      message: "Hardcoded GITHUB_APP_SECRET_TOKEN detected. Storing credentials in plain text violates security guidelines. Extract secret keys to env configuration.",
      recommendation: "System.getenv(\"GITHUB_APP_SECRET_TOKEN\")",
      authorComment: "Great catch! Extracted to environment variable.",
      resolvedDiff: 'String apiToken = System.getenv("GITHUB_APP_SECRET_TOKEN");'
    },
    architecture: {
      fileName: "src/main/java/com/prsense/backend/controller/WebhookController.java",
      linesChanged: "+2 -2",
      diffDel: 'private PullRequestRepository pullRequestRepository;',
      diffAdd: 'private GitHubService githubService;',
      agent: "Architecture Auditor",
      severity: "high",
      confidence: "94%",
      message: "Architectural boundary violation. Controllers must never invoke repositories directly. Delegate database actions to service classes.",
      recommendation: "private GitHubService githubService;",
      authorComment: "Fixed. Rerouting transactions through the service layer.",
      resolvedDiff: 'private GitHubService githubService;'
    },
    style: {
      fileName: "src/main/resources/js/helpers.js",
      linesChanged: "+2 -1",
      diffDel: 'function fetch_user_data(user_id) { return db.find(user_id); }',
      diffAdd: 'const fetchUserData = (userId) => db.find(userId);',
      agent: "Style Auditor",
      severity: "minor",
      confidence: "89%",
      message: "Naming convention mismatch. JavaScript functions must use camelCase naming ('fetchUserData' instead of 'fetch_user_data').",
      recommendation: "const fetchUserData = (userId) => db.find(userId);",
      authorComment: "Refactored to camelCase and arrow shorthand.",
      resolvedDiff: 'const fetchUserData = (userId) => db.find(userId);'
    },
    static: {
      fileName: "src/main/java/com/prsense/backend/utils/DateUtils.java",
      linesChanged: "+0 -1",
      diffDel: 'import java.text.SimpleDateFormat;',
      diffAdd: '// Unused import removed',
      agent: "Code Quality Analyzer",
      severity: "medium",
      confidence: "95%",
      message: "Unused import statement detected: `java.text.SimpleDateFormat`. Redundant imports increase cognitive compilation overhead.",
      recommendation: "Remove unused imports",
      authorComment: "Cleaned up import header.",
      resolvedDiff: ""
    }
  }

  const architectureSteps = [
    { title: "GitHub Webhook Ingestion", desc: "A developer pushes code or opens a new Pull Request. GitHub fires a webhook event signed with cryptographic payload headers." },
    { title: "Spring Boot Gateway Ingest", desc: "The primary Spring Boot backend verifies the signature, registers the metadata in PostgreSQL, and enqueues a Celery task." },
    { title: "Redis Task Broker", desc: "Spring Boot routes the review job inside a Celery envelope straight to Redis, ensuring instant response without blocking GitHub." },
    { title: "Celery Workers execution", desc: "Asynchronous Python worker threads consume the task from Redis, checkout/clone the repository, and prepare the snapshot." },
    { title: "pgvector Semantic Search Context Retrieval", desc: "The worker queries pgvector semantic storage, matching custom guidelines, naming preferences, and learned style rules." },
    { title: "Workflow Engine Multi-Stage Run", desc: "Coordinated agent nodes (Static, Security, Architecture, Style) audit the code diffs in parallel, tracing token consumption." },
    { title: "GitHub PR Reviews published", desc: "Findings are de-duplicated by the Synthesizer node, sent via callback to Spring Boot, and published as inline comments on GitHub." }
  ]

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-slate-100 font-sans selection:bg-[#ff5a1f]/30 overflow-x-hidden relative">
      
      {/* Background System Animations CSS Injector */}
      <style>{`
        @keyframes driftGrid {
          0% {
            background-position: 0px 0px;
          }
          100% {
            background-position: 3.5rem 3.5rem;
          }
        }

        @keyframes pulseLine {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }

        .animate-drift-grid {
          animation: driftGrid 28s linear infinite;
        }

        .animate-pulse-line {
          stroke-dasharray: 6, 6;
          animation: pulseLine 1.5s linear infinite;
        }

        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
      `}</style>

      {/* Layer 1: Infinite animated grid background - CodeRabbit charcoal styled */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141416_1px,transparent_1px),linear-gradient(to_bottom,#141416_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] -z-10 pointer-events-none animate-drift-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_85%,transparent_100%)] opacity-40" />

      {/* Layer 2: Floating sparkles particles (Canvas style with Framer Motion) - CodeRabbit Orange */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-15">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-r from-[#ff5a1f] to-red-500"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -130, 0],
              x: [0, 30, 0],
              opacity: [0.15, 0.65, 0.15]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Layer 3: Rotating and floating soft orange-red radial blur orbs */}
      <motion.div
        className="absolute top-[-150px] left-[15%] w-[800px] h-[800px] bg-[#ff5a1f]/5 rounded-full blur-[160px] -z-20 pointer-events-none"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -60, 80, 0],
          scale: [1, 1.2, 0.85, 1]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-[350px] right-[15%] w-[700px] h-[700px] bg-red-600/5 rounded-full blur-[140px] -z-20 pointer-events-none"
        animate={{
          x: [0, -70, 50, 0],
          y: [0, 60, -60, 0],
          scale: [1, 0.9, 1.2, 1]
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Layer 4: Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.012] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:12px_12px] -z-10 pointer-events-none" />

      {/* Layer 5: Mouse-follow spotlight gradient glow */}
      <div 
        className="absolute inset-0 -z-10 transition-opacity duration-300 pointer-events-none" 
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 90, 31, 0.09), transparent 85%)`
        }}
      />

      {/* Glass Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[#0c0c0e]/75 border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CodeRabbitLogo className="w-8 h-8" />
            <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase">
              PRSense <span className="text-[#ff5a1f] font-bold text-xs">AI</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-400 tracking-wider uppercase">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#sandbox" className="hover:text-white transition-colors">Reviews</a>
            <a href="#demo" className="hover:text-white transition-colors">Repository Intelligence</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-bold text-slate-355 hover:text-white transition-colors tracking-wider uppercase">
              Login
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/login?free-trial"
                className="px-4 py-2 bg-[#ff5a1f] hover:bg-[#e04e1b] text-white rounded text-xs font-bold transition-all duration-300 shadow-lg shadow-orange-500/10"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Two-Column Hero Section */}
      <section className="pt-44 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
        
        {/* Left Side: Massive Headline & CTAs */}
        <div className="lg:col-span-6 flex flex-col items-start text-left relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a1f] animate-pulse" />
            <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Automated Developer Ecosystem</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.95] tracking-tight">
            Automated <br />
            <span className="bg-gradient-to-r from-white via-orange-300 to-[#ff5a1f] bg-clip-text text-transparent">
              Repo Intelligence &
            </span> <br />
            Multi-Stage Reviews
          </h1>

          <p className="text-base text-slate-400 mb-10 max-w-xl leading-relaxed font-medium">
            Understand repositories, review pull requests, retrieve engineering knowledge with Semantic Search, and continuously learn coding conventions using code analyzers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <motion.div 
              whileHover={{ scale: 1.04, boxShadow: "0 0 25px rgba(255, 90, 31, 0.4)" }} 
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Link
                to="/login?free-trial"
                className="w-full h-14 bg-gradient-to-r from-[#ff5a1f] to-[#e04e1b] text-white rounded font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300"
              >
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.04 }} 
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <a
                href="#sandbox"
                className="w-full h-14 bg-white/5 border border-white/10 hover:border-white/20 text-slate-200 rounded font-bold text-sm hover:bg-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#ff5a1f]" /> Watch Demo
              </a>
            </motion.div>
          </div>

          {/* Hero Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mt-16 pt-8 border-t border-white/5">
            <div>
              <div className="text-2xl font-black text-white">240K+</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Repositories Indexed</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">18M+</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Reviews Generated</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">99.2%</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Findings Resolved</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">8,500+</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Teams Enrolled</div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Animated Review Engine & Floating AI Cards */}
        <div className="lg:col-span-6 flex items-center justify-center relative min-h-[460px]">
          
          {/* Multi-Stage Flow Network Widget Frame */}
          <div className="w-full max-w-lg bg-gradient-to-b from-white/5 to-transparent border border-white/5 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Visual Grid Inside Node Frame */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b203c_1px,transparent_1px),linear-gradient(to_bottom,#1b203c_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none -z-10" />

            {/* SVG connections flow lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 40,110 L 130,110" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 130,110 L 230,50" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 130,110 L 230,90" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 130,110 L 230,130" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 130,110 L 230,170" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 270,50 L 370,110" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 270,90 L 370,110" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 270,130 L 370,110" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 270,170 L 370,110" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />
              <path d="M 370,110 L 460,110" stroke="rgba(255, 90, 31, 0.15)" strokeWidth="2" fill="none" />

              {/* Active animated paths */}
              {activeAgentNode === "retriever" && (
                <path d="M 40,110 L 130,110" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
              )}
              {["static", "security", "architecture", "style"].includes(activeAgentNode) && (
                <>
                  <path d="M 130,110 L 230,50" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
                  <path d="M 130,110 L 230,90" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
                  <path d="M 130,110 L 230,130" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
                  <path d="M 130,110 L 230,170" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
                </>
              )}
              {activeAgentNode === "synthesizer" && (
                <>
                  <path d="M 270,50 L 370,110" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
                  <path d="M 270,90 L 370,110" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
                  <path d="M 270,130 L 370,110" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
                  <path d="M 270,170 L 370,110" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
                </>
              )}
              {activeAgentNode === "github" && (
                <path d="M 370,110 L 460,110" stroke="url(#heroLineGrad)" strokeWidth="2" fill="none" className="animate-pulse-line" />
              )}

              <defs>
                <linearGradient id="heroLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff5a1f" />
                  <stop offset="100%" stopColor="#e04e1b" />
                </linearGradient>
              </defs>
            </svg>

            {/* Nodes Row */}
            <div className="relative h-60 w-full flex items-center justify-between px-6 pt-4">
              
              {/* Repository Ingestion */}
              <div className="z-10 flex flex-col items-center">
                <motion.div 
                  className={cn(
                    "w-10 h-10 rounded-xl bg-slate-900 border flex items-center justify-center transition-all duration-300",
                    activeAgentNode === "retriever" ? "border-orange-500 shadow-lg shadow-orange-500/20" : "border-white/10"
                  )}
                  animate={activeAgentNode === "retriever" ? { scale: [1, 1.08, 1] } : {}}
                >
                  <GitBranch className="w-5 h-5 text-orange-400" />
                </motion.div>
                <span className="text-[8px] text-slate-500 font-mono mt-1">Repo Ingest</span>
              </div>

              {/* Semantic Search Context Retriever */}
              <div className="z-10 flex flex-col items-center">
                <motion.div 
                  className={cn(
                    "w-10 h-10 rounded-xl bg-slate-900 border flex items-center justify-center transition-all duration-300 relative",
                    activeAgentNode === "retriever" ? "border-orange-500 shadow-lg shadow-orange-500/25" : "border-white/10"
                  )}
                  animate={activeAgentNode === "retriever" ? { scale: [1, 1.08, 1] } : {}}
                >
                  <Search className="w-5 h-5 text-orange-400" />
                  {activeAgentNode === "retriever" && <span className="absolute inset-0 rounded-xl border border-orange-400 animate-pulse-node" />}
                </motion.div>
                <span className="text-[8px] text-slate-500 font-mono mt-1">Semantic Search Context</span>
              </div>

              {/* Parallel Agent Stack */}
              <div className="z-10 flex flex-col gap-2">
                {[
                  { id: "static", label: "Static", icon: Cpu },
                  { id: "security", label: "Security", icon: Shield },
                  { id: "architecture", label: "Arch", icon: Layers },
                  { id: "style", label: "Style", icon: Code }
                ].map(a => (
                  <div key={a.id} className="flex items-center gap-1.5">
                    <motion.div 
                      className={cn(
                        "w-8 h-8 rounded-lg bg-slate-900 border flex items-center justify-center transition-all duration-300 relative",
                        activeAgentNode === a.id ? "border-orange-500 shadow-lg shadow-orange-500/25" : "border-white/10"
                      )}
                      animate={activeAgentNode === a.id ? { scale: [1, 1.1, 1] } : {}}
                    >
                      <a.icon className="w-4 h-4 text-orange-400" />
                      {activeAgentNode === a.id && <span className="absolute inset-0 rounded-lg border border-orange-400 animate-pulse-node" />}
                    </motion.div>
                    <span className="text-[8px] text-slate-500 font-mono hidden sm:inline">{a.label}</span>
                  </div>
                ))}
              </div>

              {/* Synthesizer Coordinator */}
              <div className="z-10 flex flex-col items-center">
                <motion.div 
                  className={cn(
                    "w-10 h-10 rounded-xl bg-slate-900 border flex items-center justify-center transition-all duration-300 relative",
                    activeAgentNode === "synthesizer" ? "border-orange-500 shadow-lg shadow-orange-500/25" : "border-white/10"
                  )}
                  animate={activeAgentNode === "synthesizer" ? { scale: [1, 1.08, 1] } : {}}
                >
                  <Brain className="w-5 h-5 text-orange-400" />
                  {activeAgentNode === "synthesizer" && <span className="absolute inset-0 rounded-xl border border-orange-400 animate-pulse-node" />}
                </motion.div>
                <span className="text-[8px] text-slate-500 font-mono mt-1">Synthesizer</span>
              </div>

              {/* GitHub Comments Node */}
              <div className="z-10 flex flex-col items-center">
                <motion.div 
                  className={cn(
                    "w-10 h-10 rounded-xl bg-slate-900 border flex items-center justify-center transition-all duration-300 relative",
                    activeAgentNode === "github" ? "border-orange-500 shadow-lg shadow-orange-500/25" : "border-white/10"
                  )}
                  animate={activeAgentNode === "github" ? { scale: [1, 1.08, 1] } : {}}
                >
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  {activeAgentNode === "github" && <span className="absolute inset-0 rounded-xl border border-orange-400 animate-pulse-node" />}
                </motion.div>
                <span className="text-[8px] text-slate-500 font-mono mt-1">PR Feedback</span>
              </div>

            </div>

            {/* Counters Ticker Box */}
            <div className="grid grid-cols-3 gap-4 bg-white/[0.02] border border-white/5 p-3.5 rounded-xl font-mono text-[10px] text-slate-450">
              <div>
                <span className="text-slate-650 block text-[8px] uppercase tracking-wider mb-0.5 font-sans">Active Agent</span>
                <span className="text-[#ff5a1f] font-bold capitalize flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
                  {activeAgentNode} Agent
                </span>
              </div>
              <div>
                <span className="text-slate-650 block text-[8px] uppercase tracking-wider mb-0.5 font-sans">Tokens Analyzed</span>
                <span className="text-white font-bold">{tokensCount.toLocaleString()} tkn</span>
              </div>
              <div>
                <span className="text-slate-655 block text-[8px] uppercase tracking-wider mb-0.5 font-sans">Incurred Cost</span>
                <span className="text-emerald-400 font-bold">${costCount.toFixed(4)}</span>
              </div>
            </div>

            {/* Live Ticker log console */}
            <div className="border-t border-white/5 pt-3 mt-3">
              <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest block mb-2 font-mono">Live Agent Ticker</span>
              <div className="space-y-1.5 font-mono text-[10px]">
                {feedLogs.map((log, idx) => (
                  <div key={idx} className={cn(
                    "truncate leading-normal transition-opacity duration-300",
                    idx === 0 ? "text-slate-250" : idx === 1 ? "text-slate-400" : "text-slate-600"
                  )}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating AI Cards Overlay around Node Graph */}
          {/* Card 1: Security Alert */}
          <motion.div 
            className="absolute -top-6 -right-6 bg-slate-950/80 border border-red-500/20 backdrop-blur-md p-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-[190px] pointer-events-none select-none z-20"
            animate={{ y: [0, -12, 0], rotate: [-1, 2, -1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Shield className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider block">Security Audit</span>
              <span className="text-[9px] text-white font-medium block mt-0.5 leading-normal">Credential Key Leak</span>
            </div>
          </motion.div>

          {/* Card 2: Architecture Finding */}
          <motion.div 
            className="absolute bottom-12 -left-6 bg-slate-950/80 border border-orange-500/20 backdrop-blur-md p-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-[190px] pointer-events-none select-none z-20"
            animate={{ y: [0, 15, 0], rotate: [2, -2, 2] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <Layers className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <span className="text-[8px] font-bold text-orange-400 uppercase tracking-wider block">Arch Layering</span>
              <span className="text-[9px] text-white font-medium block mt-0.5 leading-normal">Controller bypass check</span>
            </div>
          </motion.div>

          {/* Card 3: Style Suggestion */}
          <motion.div 
            className="absolute -bottom-6 -right-6 bg-slate-950/80 border border-[#ff5a1f]/20 backdrop-blur-md p-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-[190px] pointer-events-none select-none z-20"
            animate={{ y: [0, -15, 0], rotate: [-2, 1, -2] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Code className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <span className="text-[8px] font-bold text-orange-400 uppercase tracking-wider block">Style Rule</span>
              <span className="text-[9px] text-white font-medium block mt-0.5 leading-normal">camelCase required</span>
            </div>
          </motion.div>

          {/* Card 4: Semantic Search Context Pinned */}
          <motion.div 
            className="absolute top-10 -left-8 bg-slate-950/80 border border-emerald-500/20 backdrop-blur-md p-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-[190px] pointer-events-none select-none z-20"
            animate={{ y: [0, 10, 0], rotate: [1, -1, 1] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Search className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">pgvector Semantic Search</span>
              <span className="text-[9px] text-slate-200 font-medium block mt-0.5 leading-normal">Matched conventions</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Trust Section */}
      <motion.section 
        className="py-14 border-y border-white/5 bg-white/[0.01]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Integrated Ecosystem</span>
          <div className="flex flex-wrap gap-8 items-center justify-center opacity-45 hover:opacity-75 transition-opacity duration-300">
            {["GitHub", "Spring Boot", "FastAPI", "PostgreSQL", "Redis", "Workflow Engine", "Analysis Engine", "Prometheus", "Grafana"].map((t, idx) => (
              <span key={idx} className="text-xs font-mono font-bold text-white tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a1f]" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-28 px-6 max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-black text-white tracking-tight">Faster reviews + better code.</h2>
          <p className="text-xs text-slate-450 mt-2">We do the heavy lifting & spot the hard to find issues. You do the final 10%.</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
        >
          {[
            { title: "Repository Intelligence", desc: "Automatic mapping and summary parsing of repository configurations. Generates structural dependency flow graphs to audit boundary layering.", icon: GitBranch, col: "#ff5a1f" },
            { title: "Pull Request Reviews", desc: "Parallel multi-stage scanner reviewing code quality, credentials exposure, layering, and database SQL injections automatically.", icon: Shield, col: "#ff5a1f" },
            { title: "Repository Search", desc: "Cursor-style conversational chat utilizing pgvector semantic Semantic Search search across the entire codebase with clickable file citations.", icon: Search, col: "#ff5a1f" },
            { title: "Rule Learner", desc: "Automatically extracts conventions and coding preferences from merged commit logs history to adjust rules dynamically.", icon: Brain, col: "#ff5a1f" },
            { title: "Observability Tracing", desc: "Detailed trace Gantt timelines monitoring the latencies, tokens consumed, and API costs of individual agent modules.", icon: BarChart3, col: "#ff5a1f" },
            { title: "Multi-Stage Workflows", desc: "Coordinated Workflow Engine routing system parsing code segments to specialized agent roles, returning unified PR commentary.", icon: Workflow, col: "#ff5a1f" }
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
              }}
              whileHover={{ scale: 1.03, borderColor: `${f.col}40` }}
              className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 flex flex-col justify-between min-h-[220px] group"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105"
                style={{ backgroundColor: `${f.col}10`, border: `1px solid ${f.col}20` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.col }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Interactive Review Sandbox */}
      <section id="sandbox" className="py-24 px-6 relative bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">Interactive Review Sandbox</h2>
            <p className="text-xs text-slate-450 max-w-xl mx-auto leading-relaxed">
              Select a specialized review track to watch PRSense analyze your files, report issues, and post suggestion comments directly.
            </p>

            {/* Interactive scan categories */}
            <div className="flex justify-center gap-2 mt-8 flex-wrap">
              {[
                { id: "security", label: "Security", icon: Shield },
                { id: "architecture", label: "Architecture", icon: Layers },
                { id: "style", label: "Style Rules", icon: Code },
                { id: "static", label: "Static Analysis", icon: Cpu }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                    activeTab === t.id
                      ? "bg-[#ff5a1f]/10 border-[#ff5a1f] text-white"
                      : "bg-[#050816]/60 border-white/5 text-slate-455 hover:text-slate-200 hover:border-white/10"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 3-Panel Replica Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch bg-white/[0.02] border border-white/5 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
            
            {/* Panel 1: Review Summary & Files Ingested */}
            <div className="lg:col-span-3 bg-slate-950/60 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 font-mono">Estimated Review Effort</h3>
                
                {/* Visual Donut Chart */}
                <div className="flex items-center gap-4 bg-[#0c0c0e] border border-white/5 p-3.5 rounded-xl mb-4">
                  <div className="relative w-12 h-12 rounded-full border-4 border-slate-900 flex items-center justify-center font-mono">
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#ff5a1f] border-r-[#ff5a1f] border-b-transparent border-l-transparent animate-spin-slow" />
                    <span className="text-[10px] font-bold text-white">
                      {simStep >= 3 ? "100%" : "30%"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {simStep >= 3 ? "Great start! 🥕" : "Analyzing code..."}
                    </h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {simStep >= 3 ? "Review finished successfully." : "Running agent checks."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Webhook verified</span>
                    <span className="text-[9px] text-slate-600 font-mono">200 OK</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 animate-pulse-node">
                    <span className="flex items-center gap-1.5">
                      {simStep >= 1 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 border-2 border-slate-800 border-t-[#ff5a1f] rounded-full animate-spin" />}
                      Ingesting Celery Task
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono">Redis</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      {simStep >= 3 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full bg-slate-800" />}
                      Workflow Engine Agents Run
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono font-mono">FastAPI</span>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/5 pt-5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-mono">Review Details</span>
                  <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>Files changed:</span>
                      <span className="text-[#ff5a1f]">{mockDiffs[activeTab].linesChanged}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Execution cost:</span>
                      <span>$0.0031</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-white/5 mt-5">
                <Link to="/login" className="w-full py-2.5 rounded-lg bg-slate-900 border border-white/5 hover:border-white/10 transition text-center text-xs font-bold text-white block font-sans">
                  Open console view
                </Link>
              </div>
            </div>

            {/* Panel 2: Code Review Diff Viewer (Simulated) */}
            <div className="lg:col-span-5 bg-slate-955/60 border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between">
              <div className="flex-1 flex flex-col">
                <div className="bg-slate-900/80 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80%]">
                    {mockDiffs[activeTab].fileName}
                  </span>
                  <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono border border-white/5">
                    diff
                  </span>
                </div>

                {/* Simulated Diff Editor Output */}
                <div className="p-4 flex-1 font-mono text-[11px] leading-relaxed space-y-1 bg-[#0c0c0e]/80">
                  <div className="text-slate-600 text-[9px] mb-2 select-none">@@ -15,10 +15,12 @@</div>
                  
                  {simStep >= 2 ? (
                    <>
                      <div className="px-2 py-1 rounded border-l-2 bg-red-500/5 text-red-400 border-red-500 break-all whitespace-pre-wrap">
                        {simStep >= 4 ? `// Removed issue line` : `- ${mockDiffs[activeTab].diffDel}`}
                      </div>
                      <div className="px-2 py-1 rounded border-l-2 bg-green-500/5 text-green-400 border-green-500 break-all whitespace-pre-wrap">
                        + {mockDiffs[activeTab].diffAdd}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-slate-600 gap-2">
                      <div className="w-4 h-4 border-2 border-slate-700 border-t-[#ff5a1f] rounded-full animate-spin" />
                      Loading diff...
                    </div>
                  )}
                </div>
              </div>

              {/* Bot Review Comment box */}
              {simStep >= 3 && (
                <div className="p-4 border-t border-white/5 bg-[#0c0c0e] space-y-3 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <CodeRabbitLogo className="w-6 h-6" />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                          prsense <span className="bg-[#ff5a1f]/10 text-[#ff5a1f] px-1 py-0.2 rounded text-[9px] font-medium border border-[#ff5a1f]/20">bot</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">1 min ago</div>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-wider border font-mono",
                      mockDiffs[activeTab].severity === "critical" && "bg-red-500/10 text-red-400 border-red-500/20",
                      mockDiffs[activeTab].severity === "high" && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                      mockDiffs[activeTab].severity === "medium" && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                      mockDiffs[activeTab].severity === "minor" && "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {mockDiffs[activeTab].severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-350 leading-relaxed bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    {mockDiffs[activeTab].message}
                  </p>
                </div>
              )}
            </div>

            {/* Panel 3: Committable Suggestions & Author Dialog */}
            <div className="lg:col-span-4 bg-slate-950/60 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Committable Suggestions</h3>
                
                {simStep >= 3 ? (
                  <div className="space-y-4">
                    {/* GitHub styled code block recommendation */}
                    <div className="border border-[#ff5a1f]/25 bg-[#ff5a1f]/5 rounded-xl p-4 space-y-2.5">
                      <span className="text-[10px] font-bold text-orange-400 block uppercase tracking-wider font-sans animate-pulse-node">Suggested Change</span>
                      <div className="font-mono text-[10px] bg-[#0c0c0e] p-2.5 rounded border border-white/5 text-emerald-400 leading-relaxed overflow-x-auto">
                        {mockDiffs[activeTab].recommendation}
                      </div>
                      <button className="w-full py-2 bg-gradient-to-r from-[#ff5a1f] to-[#e04e1b] text-white rounded text-[10px] font-bold shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 transition-all">
                        <Check className="w-3.5 h-3.5" /> Apply Suggestion
                      </button>
                    </div>

                    {/* Developer response thread */}
                    {simStep >= 4 && (
                      <div className="space-y-3 pt-3 border-t border-white/5 transition-all duration-300">
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-extrabold text-white">
                            JB
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-sans">
                              jbrooks215 <span className="text-slate-500 font-normal text-[9px] font-mono">author • Now</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-normal italic bg-slate-900/60 px-3 py-2 rounded-lg border border-white/5 font-sans">
                              "{mockDiffs[activeTab].authorComment}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Issue Resolved & Closed
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-24 text-center text-slate-650 text-xs font-mono animate-pulse-node">
                    <div className="w-5 h-5 border-2 border-slate-700 border-t-[#ff5a1f] rounded-full animate-spin mx-auto mb-2" />
                    Waiting for Agent findings...
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 text-center pt-4 border-t border-white/5 font-mono">
                💡 Demo simulates a live PR review trigger via Webhook
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Architecture Flow Section */}
      <section id="architecture" className="py-20 px-6 bg-white/[0.01] border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-black text-white tracking-tight">Interactive Pipeline Architecture</h2>
            <p className="text-xs text-slate-400 mt-2">See how code changes flow through our Spring Boot gateway, Redis task broker, and FastAPI Workflow Engine agent workflows.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Step Navigator */}
            <div className="lg:col-span-4 space-y-2.5">
              {architectureSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setArchStep(idx)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer",
                    archStep === idx
                      ? "bg-[#ff5a1f]/10 border-[#ff5a1f] text-white"
                      : "bg-[#050816]/20 border-white/5 text-slate-455 hover:text-slate-355 hover:bg-white/5"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black font-mono shrink-0",
                    archStep === idx ? "bg-[#ff5a1f] text-white" : "bg-slate-800 text-slate-500"
                  )}>
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold">{step.title}</span>
                </button>
              ))}
            </div>

            {/* Visualizer Display */}
            <div className="lg:col-span-8 p-6 rounded-2xl border border-white/5 bg-slate-955/75 shadow-2xl relative min-h-[300px] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#ff5a1f] uppercase tracking-widest block mb-2 font-mono">Step {archStep + 1} of 7</span>
                <h3 className="text-base font-bold text-white mb-3">{architectureSteps[archStep].title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {architectureSteps[archStep].desc}
                </p>
              </div>

              {/* Graphical Path Visualizer */}
              <div className="mt-8 border-t border-white/5 pt-6">
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                  <span>Git Webhook</span>
                  <span>Redis Queue</span>
                  <span>FastAPI Agents</span>
                  <span>PR Comments</span>
                </div>
                <div className="relative h-2 bg-slate-900 rounded-full mt-2 overflow-hidden border border-white/5 animate-pulse-node">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff5a1f] to-orange-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(255,90,31,0.5)]"
                    style={{ width: `${((archStep + 1) / 7) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Section - Auto Carousel Viewport */}
      <section id="demo" className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">Explore the Product Workspace</h2>
            <p className="text-xs text-slate-450 max-w-xl mx-auto leading-relaxed">
              Auto-cycling mock previews representing the core console pages used by teams daily.
            </p>

            {/* View selectors */}
            <div className="flex justify-center gap-2 mt-8 flex-wrap">
              {[
                { id: "repository", label: "Repository View" },
                { id: "review", label: "Review View" },
                { id: "agent", label: "Agent View" },
                { id: "timeline", label: "Timeline View" },
                { id: "monitoring", label: "Monitoring View" }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setDemoView(v.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                    demoView === v.id
                      ? "bg-[#ff5a1f]/10 border-[#ff5a1f] text-white"
                      : "bg-[#050816]/60 border-white/5 text-slate-500 hover:text-slate-350 hover:border-white/10"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Viewport Frame with auto-scroll animation overlay */}
          <div className="border border-white/5 bg-slate-950/80 rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            {/* Window bar */}
            <div className="flex gap-1.5 items-center mb-5 pb-3 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="text-[10px] text-slate-500 font-mono ml-4">prsense-console // {demoView}</span>
            </div>

            {/* View contents wrapper */}
            <div className="min-h-[350px] flex flex-col justify-between relative transition-all duration-300">
              
              {demoView === "repository" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                    <div>
                      <h4 className="text-sm font-bold text-white">anshptk949-hue / prsense-service</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">Status: Fully Indexed • Webhook active</p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase font-mono">Online</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-mono">Branches</span>
                      <span className="text-xl font-bold text-white font-mono">12 Active</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-mono">Open Pull Requests</span>
                      <span className="text-xl font-bold text-white font-mono">8 Pending</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-mono">Average Review Time</span>
                      <span className="text-xl font-bold text-white font-mono">1.4 minutes</span>
                    </div>
                  </div>
                </div>
              )}

              {demoView === "review" && (
                <div className="space-y-4">
                  <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                      <span>src/main/java/.../UserRepository.java</span>
                      <span className="text-[#ff5a1f] font-bold font-mono">+18 -2 lines</span>
                    </div>
                    <div className="p-3 bg-red-500/5 text-red-400 border-l-2 border-red-500 rounded font-mono text-[10px]">
                      - User findByEmail(String email); // Missing Index constraints
                    </div>
                    <div className="p-3 bg-[#ff5a1f]/15 border border-[#ff5a1f]/30 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white">
                        <CodeRabbitLogo className="w-5 h-5" /> prsense [bot] 1m ago
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Database Performance smell. Calling findByEmail without email indexing constraint degrades query processing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {demoView === "agent" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Workflow Engine Agent Topology</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {["Coordinator", "Security Auditor", "Architecture Boundary", "Style Standard"].map((agent, i) => (
                      <div key={i} className="bg-white/[0.02] border border-[#ff5a1f]/20 p-4 rounded-xl flex flex-col justify-between min-h-[100px] shadow-lg shadow-orange-500/5">
                        <span className="text-[10px] font-bold text-white block">{agent}</span>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2 font-mono">
                          <span>Latency: 0.8s</span>
                          <span className="text-emerald-400">98% match</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {demoView === "timeline" && (
                <div className="space-y-3 font-mono text-xs text-slate-400">
                  <h4 className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">LangSmith Trace Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded border border-white/5">
                      <span>1. Webhook Ingested</span>
                      <span className="text-emerald-400 font-bold">200ms • Completed</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded border border-white/5">
                      <span>2. pgvector Embeddings Match</span>
                      <span className="text-emerald-400 font-bold">450ms • Completed</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#ff5a1f]/5 p-2.5 rounded border border-[#ff5a1f]/30">
                      <span>3. Coordinated Agents Analysis</span>
                      <span className="text-[#ff5a1f] font-bold">1200ms • Active</span>
                    </div>
                  </div>
                </div>
              )}

              {demoView === "monitoring" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider font-mono">Queue Latency</span>
                      <span className="text-2xl font-bold text-white font-mono">45ms</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider font-mono font-mono">Active Workers</span>
                      <span className="text-2xl font-bold text-white font-mono">8/8 Live</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider font-mono font-mono">Success Rate</span>
                      <span className="text-2xl font-bold text-emerald-400 font-mono">99.8%</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider font-mono font-mono">Memory Usage</span>
                      <span className="text-2xl font-bold text-white font-mono">32%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-5 text-[10px] text-slate-500">
                <span>Auto-scrolling mock simulation</span>
                <span className="text-[#ff5a1f] hover:underline font-bold cursor-pointer">Learn more about console workspaces &rarr;</span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Flexible plans for any team size</h2>
          <p className="text-xs text-slate-450 mt-2">Get started for free. Upgrade whenever you need advanced style learning and Semantic Search systems.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Starter</h3>
                <p className="text-[10px] text-slate-500">For personal or small open-source repos.</p>
              </div>
              <div className="text-3xl font-extrabold text-white">$0 <span className="text-xs text-slate-500 font-medium">/ forever</span></div>
              <div className="h-px bg-white/5" />
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Up to 3 active repositories</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Automated Static Analysis</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Basic Security Checks</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Webhook integrations</li>
              </ul>
            </div>
            <Link to="/login" className="mt-8 w-full py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition text-center text-xs font-bold text-white block">
              Start for Free
            </Link>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-orange-950/10 to-[#0c0c0e]/80 border border-[#ff5a1f]/35 relative flex flex-col justify-between shadow-xl shadow-orange-500/5">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff5a1f] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse-node">
              Most Popular
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-sans">Developer Pro</h3>
                <p className="text-[10px] text-slate-400">For professional engineering groups.</p>
              </div>
              <div className="text-3xl font-extrabold text-white">$29 <span className="text-xs text-slate-500 font-medium">/ user / mo</span></div>
              <div className="h-px bg-white/5" />
              <ul className="space-y-3 text-xs text-slate-350">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Unlimited Repositories</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Full Analysis Pipeline Graph</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Semantic Search Repository Intelligence</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Automated Rule Learner</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Detailed Telemetry Tracing</li>
              </ul>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/login" className="mt-8 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#ff5a1f] to-[#e04e1b] text-center text-xs font-bold text-white block transition-all">
                Try Pro Free
              </Link>
            </motion.div>
          </div>

          {/* Enterprise Tier */}
          <div className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-sans">Enterprise</h3>
                <p className="text-[10px] text-slate-500">For security-critical organizations.</p>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">Custom <span className="text-xs text-slate-500 font-medium">/ yearly</span></div>
              <div className="h-px bg-white/5" />
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Everything in Pro</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> On-Premises deployments</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Custom Analysis Core gateway integration</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ff5a1f]" /> Dedicated SLA Support</li>
              </ul>
            </div>
            <a href="mailto:support@prsense.ai" className="mt-8 w-full py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition text-center text-xs font-bold text-white block font-sans">
              Contact Enterprise
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-black text-white text-center mb-10 tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How does the Rule Learner work?", a: "When you merge a PR, the system runs an async learner task parsing the code diff and extracting conventions. These are stored in pgvector, which allows other agents to query them as context during future reviews." },
              { q: "Do you store our proprietary source code?", a: "No. The code is only checked out temporarily in worker threads during review execution. The files are deleted instantly once the analysis completes. The only data kept in the database are the metadata of your repositories, the generated issues list, and the general patterns extracted by the Rule Learner." },
              { q: "How is it configured for our company rules?", a: "You can provide custom architectural files or write a set of guidelines. The Semantic Search architecture scans these files and automatically informs the agents if a developer violates those constraints." }
            ].map((faq, index) => (
              <div key={index} className="p-5 rounded-xl border border-white/5 bg-[#050816]/30 space-y-2 animate-fade-in">
                <h4 className="text-xs font-extrabold text-slate-200">{faq.q}</h4>
                <p className="text-xs text-slate-450 leading-relaxed font-sans">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#03050f] py-12 px-6 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <CodeRabbitLogo className="w-6 h-6" />
            <span className="font-extrabold text-slate-350 uppercase tracking-widest">PRSense</span>
          </div>
          <div>All rights reserved &copy; 2026 PRSense Inc.</div>
        </div>
      </footer>
    </div>
  )
}
