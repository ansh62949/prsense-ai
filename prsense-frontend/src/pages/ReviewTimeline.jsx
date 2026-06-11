import React, { useState, useEffect } from "react"
import { 
  Clock, 
  GitPullRequest, 
  Database, 
  Cpu, 
  AlertTriangle, 
  Award,
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  TrendingUp,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Coins,
  CpuIcon,
  Search,
  SlidersHorizontal,
  Code,
  ArrowRight,
  Terminal,
  Activity
} from "lucide-react"

// CodeRabbit Circular White-Rabbit Logo Custom component
const CodeRabbitLogo = ({ className = "w-8 h-8" }) => (
  <div className={"rounded-full bg-[#ff5a1f] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 " + className}>
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
      <path d="M12 9c-2.8 0-5 2.2-5 5v3c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4v-3c0-2.8-2.2-5-5-5zm-2.5-7c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1zm5 0c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1z" />
    </svg>
  </div>
)

export default function ReviewTimeline() {
  const [activeRepo, setActiveRepo] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [reviewDetails, setReviewDetails] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [expandedStep, setExpandedStep] = useState(null)

  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })

  useEffect(() => {
    if (selectedRepoId) {
      fetchRepositoryDetails(selectedRepoId)
      fetchTimeline(selectedRepoId)
    } else {
      setActiveRepo(null)
      setTimeline([])
    }

    const handleRepoChange = () => {
      const newRepoId = localStorage.getItem("prsense_selected_repo_id") || ""
      setSelectedRepoId(newRepoId)
      if (newRepoId) {
        fetchRepositoryDetails(newRepoId)
        fetchTimeline(newRepoId)
      } else {
        setActiveRepo(null)
        setTimeline([])
      }
    }

    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [selectedRepoId])

  useEffect(() => {
    if (selectedReview) {
      fetchReviewDetails(selectedReview.reviewId)
    } else {
      setReviewDetails(null)
    }
  }, [selectedReview])

  const fetchRepositoryDetails = async (id) => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Bearer ${token}` } : {}
      const res = await fetch(`${window.API_BASE_URL}/api/repositories/${id}`, { headers })
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

  const fetchTimeline = async (repoId) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Bearer ${token}` } : {}
      const res = await fetch(`${window.API_BASE_URL}/api/analytics/timeline/${repoId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = data.timeline || []
        setTimeline(items)
        if (items.length > 0) {
          setSelectedReview(items[0])
        } else {
          setSelectedReview(null)
        }
      } else {
        setTimeline([])
        setSelectedReview(null)
      }
    } catch (e) {
      console.error("Failed to fetch timeline logs", e)
      setTimeline([])
      setSelectedReview(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewDetails = async (reviewId) => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Bearer ${token}` } : {}
      const res = await fetch(`${window.API_BASE_URL}/api/reviews/${reviewId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setReviewDetails(data)
      } else {
        setReviewDetails(null)
      }
    } catch (e) {
      console.error("Failed to fetch review details", e)
      setReviewDetails(null)
    }
  }

  // Gantt trace data representing the multi-agent LangGraph run
  const defaultGanttTrace = [
    { node: "input_validator", name: "PR Input Ingest & Validator", start: 0, duration: 180, tokens: 620, cost: 0.00009, color: "from-[#ff5a1f] to-orange-400", inputs: { prNumber: 42, branch: "main", commitSha: "f4b7e740" }, outputs: { status: "VALIDATED", scope: "12 files changed" } },
    { node: "rag_retriever", name: "Semantic Context Retrieval", start: 15, duration: 320, tokens: 1850, cost: 0.00028, color: "from-yellow-500 to-amber-500", inputs: { query: " SOLID principles, naming conventions", limit: 5 }, outputs: { matchedRulesCount: 4, averageSimilarity: "0.89" } },
    { node: "static_analysis", name: "Static Analysis Agent", start: 30, duration: 420, tokens: 2400, cost: 0.00036, color: "from-blue-500 to-cyan-500", inputs: { files: ["queries.js", "auth.js"] }, outputs: { complexityViolations: 2, earlyReturnsFollowed: true } },
    { node: "security_check", name: "Security Check Agent", start: 30, duration: 510, tokens: 3100, cost: 0.00047, color: "from-red-500 to-rose-500", inputs: { scope: "secrets & raw queries scan" }, outputs: { secretsFound: 1, credentialsLeaked: ["AI_COPILOT_SECRET_X99"] } },
    { node: "architecture_check", name: "Architecture Boundary Agent", start: 30, duration: 610, tokens: 4120, cost: 0.00062, color: "from-purple-500 to-indigo-500", inputs: { moduleStructure: "strict controller-service-repo" }, outputs: { violations: 0, circularDependencies: 0 } },
    { node: "style_check", name: "Style Standard Agent", start: 30, duration: 480, tokens: 2800, cost: 0.00042, color: "from-green-500 to-emerald-500", inputs: { ruleset: "eslint-recommended" }, outputs: { warningCount: 3, formattedCorrectly: false } },
    { node: "merge_findings", name: "Deduplication & Merge Node", start: 65, duration: 250, tokens: 1950, cost: 0.00029, color: "from-slate-500 to-slate-400", inputs: { totalInputViolations: 6 }, outputs: { uniqueViolationsMerged: 4 } },
    { node: "decision_synthesizer", name: "Approved / Rejected Synthesis", start: 85, duration: 340, tokens: 3400, cost: 0.00051, color: "from-[#ff5a1f] to-red-500", inputs: { findingsList: ["Security Leak", "Style warning"] }, outputs: { finalDecision: "CHANGES_REQUESTED", commentPublished: true } }
  ]

  // Filtered timeline reviews
  const filteredTimeline = timeline.filter(item => {
    const matchesSearch = item.prTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.prNumber.toString().includes(searchQuery) ||
                          item.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || item.aiDecision === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const averageDuration = timeline.length > 0 
    ? Math.round(timeline.reduce((acc, curr) => acc + curr.executionTimeMs, 0) / timeline.length)
    : 0
  const totalCost = timeline.length > 0
    ? timeline.reduce((acc, curr) => {
        const steps = curr.steps || []
        const itemCost = steps.reduce((sum, s) => sum + (s.cost || 0), 0)
        return acc + (itemCost || 0.003) // fallback estimation
      }, 0)
    : 0

  return (
    <div className="p-6 space-y-6 text-foreground bg-[#0c0c0e] min-h-screen">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff5a1f]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-red-650/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 rounded-xl">
              <Clock className="text-[#ff5a1f] w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Execution Trace Inspector
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Inspect parallel multi-agent LangGraph flows, token footprints, and step-by-step telemetry logs.
              </p>
            </div>
          </div>
        </div>

        {activeRepo && (
          <div className="flex items-center gap-3 bg-[#09090b] border border-slate-900 px-4 py-2 rounded-xl text-xs backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-450 font-semibold">Scope:</span>
              <span className="text-[#ff5a1f] font-extrabold">{activeRepo.fullName}</span>
            </div>
            <div className="w-px h-3 bg-slate-900" />
            <button 
              onClick={() => fetchTimeline(activeRepo.id)}
              className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Refresh Traces"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {!activeRepo ? (
        <div className="h-[400px] border border-dashed border-slate-900 rounded-2xl flex flex-col justify-center items-center text-center p-8 space-y-4 bg-slate-950/20 backdrop-blur-md relative z-10">
          <div className="p-4 bg-slate-950 border border-slate-900 rounded-full">
            <AlertCircle className="w-10 h-10 text-slate-400 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Active Repository</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              Please select a repository in the top header menu to audit real-time review execution traces.
            </p>
          </div>
        </div>
      ) : loading && timeline.length === 0 ? (
        <div className="h-96 flex flex-col justify-center items-center space-y-4 relative z-10">
          <RefreshCw className="w-10 h-10 text-[#ff5a1f] animate-spin" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Retrieving telemetry traces...</p>
        </div>
      ) : timeline.length === 0 ? (
        <div className="border border-dashed border-slate-900 p-12 rounded-2xl text-center space-y-4 bg-[#09090b]/20 backdrop-blur-md relative z-10">
          <div className="p-4 bg-slate-900 border border-slate-900 rounded-full inline-block">
            <GitPullRequest className="w-8 h-8 text-slate-550 mx-auto" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-lg text-white">No Execution Traces Yet</h3>
            <p className="text-slate-400 text-sm">
              Configure code webhooks or run reviews in the repository to trigger multi-agent pipeline executions.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          
          {/* Top telemetry card summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#09090b]/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Total Traces Audited</span>
              <div className="text-2xl font-black text-white mt-1">{timeline.length} runs</div>
            </div>
            <div className="bg-[#09090b]/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Avg Latency</span>
              <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1">
                {averageDuration}
                <span className="text-xs font-semibold text-slate-400">ms</span>
              </div>
            </div>
            <div className="bg-[#09090b]/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Total Estim. Expense</span>
              <div className="text-2xl font-black text-[#ff5a1f] mt-1 flex items-baseline gap-1 font-mono">
                ${totalCost.toFixed(4)}
                <span className="text-xs font-semibold text-slate-400">USD</span>
              </div>
            </div>
            <div className="bg-[#09090b]/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Success Rate</span>
              <div className="text-2xl font-black text-emerald-450 mt-1">
                {Math.round((timeline.filter(t => t.aiDecision === "APPROVED" || t.aiDecision === "CHANGES_REQUESTED").length / timeline.length) * 100)}%
              </div>
            </div>
          </div>

          {/* Two-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Panel: List of Traces (4 cols) */}
            <div className="lg:col-span-4 space-y-3 max-h-[650px] overflow-y-auto pr-1">
              <div className="bg-[#09090b]/60 border border-slate-900 p-3 rounded-xl space-y-3 sticky top-0 z-10 backdrop-blur-md">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search traces..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-slate-900 text-xs rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5a1f]/50"
                  />
                </div>
                <div className="flex gap-1.5">
                  {["ALL", "APPROVED", "CHANGES_REQUESTED"].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex-1 text-[9px] font-black py-1.5 rounded-md border transition-all cursor-pointer ${
                        statusFilter === status 
                          ? "bg-[#ff5a1f]/10 border-[#ff5a1f]/30 text-[#ff5a1f]" 
                          : "bg-[#0c0c0e] border-slate-900 text-slate-450 hover:text-white"
                      }`}
                    >
                      {status === "CHANGES_REQUESTED" ? "CHANGES" : status}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTimeline.map((item) => {
                const isSelected = selectedReview && selectedReview.reviewId === item.reviewId;
                return (
                  <div
                    key={item.reviewId}
                    onClick={() => {
                      setSelectedReview(item)
                      setExpandedStep(null)
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:border-slate-800 ${
                      isSelected 
                        ? "bg-[#09090b]/80 border-[#ff5a1f]/30 shadow-[0_0_15px_rgba(255,90,31,0.05)]" 
                        : "bg-[#09090b]/30 border-slate-900"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-900 text-slate-300 font-extrabold px-1.5 py-0.5 rounded shrink-0 border border-slate-800">
                            PR #{item.prNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${
                            item.aiDecision === "APPROVED" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {item.aiDecision}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-white truncate">{item.prTitle}</h4>
                      </div>
                      <span className="text-[10px] text-slate-450 font-mono shrink-0">{item.executionTimeMs}ms</span>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-900/50 text-[10px] text-slate-500 font-semibold">
                      <span>By: <span className="font-bold text-slate-350">{item.author}</span></span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}

              {filteredTimeline.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 bg-[#09090b]/10 border border-dashed border-slate-900 rounded-xl">
                  No matching traces found.
                </div>
              )}
            </div>

            {/* Right Panel: Selected Trace Gantt & Log details (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {selectedReview ? (
                <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-md space-y-6">
                  
                  {/* Selected Trace Info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f] font-black px-2 py-0.5 rounded">
                          Trace ID: {typeof selectedReview.reviewId === 'string' ? selectedReview.reviewId.slice(0, 8) : selectedReview.reviewId}
                        </span>
                        <span className="text-slate-500 text-xs font-mono">•</span>
                        <span className="text-slate-450 text-xs font-medium">PR #{selectedReview.prNumber} by {selectedReview.author}</span>
                      </div>
                      <h2 className="text-lg font-black text-white mt-1.5">{selectedReview.prTitle}</h2>
                    </div>

                    <div className="flex gap-2">
                      <div className="bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-lg text-center">
                        <div className="text-[9px] uppercase font-bold text-slate-500">Latency</div>
                        <div className="text-xs font-extrabold text-white font-mono">{selectedReview.executionTimeMs} ms</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-lg text-center">
                        <div className="text-[9px] uppercase font-bold text-slate-500">Decision</div>
                        <div className={`text-xs font-black uppercase ${
                          selectedReview.aiDecision === "APPROVED" ? "text-emerald-450" : "text-amber-450"
                        }`}>{selectedReview.aiDecision}</div>
                      </div>
                    </div>
                  </div>

                  {/* Gantt chart Visualizer */}
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      LangGraph Execution Steps Gantt Chart
                    </h3>

                    {(() => {
                      let accumulatedStart = 0;
                      const hasSteps = selectedReview.steps && selectedReview.steps.length > 0;
                      if (!hasSteps) {
                        return (
                          <div className="py-12 text-center border border-dashed border-slate-900 rounded-2xl bg-slate-950/20">
                            <Clock className="w-10 h-10 text-slate-605 mx-auto mb-3 animate-pulse" />
                            <p className="text-xs text-slate-450 font-bold">No detailed execution steps recorded for this trace.</p>
                          </div>
                        )
                      }
                      
                      const totalDuration = selectedReview.steps.reduce((acc, s) => acc + s.duration_ms, 0);
                      
                      const stepsToRender = selectedReview.steps.map((s, idx) => {
                            const start = accumulatedStart;
                            accumulatedStart += s.duration_ms;
                            
                            let color = "from-[#ff5a1f] to-orange-400";
                            const name = s.step_name.toLowerCase();
                            if (name.includes("rag") || name.includes("retrieval") || name.includes("context")) color = "from-yellow-500 to-amber-500";
                            else if (name.includes("static")) color = "from-blue-500 to-cyan-500";
                            else if (name.includes("security")) color = "from-red-500 to-rose-500";
                            else if (name.includes("architecture")) color = "from-purple-500 to-indigo-500";
                            else if (name.includes("style")) color = "from-green-500 to-emerald-500";
                            else if (name.includes("merge")) color = "from-slate-500 to-slate-400";
                            else if (name.includes("synthesizer") || name.includes("summary") || name.includes("synthesis")) color = "from-[#ff5a1f] to-red-500";
                            
                            return {
                              node: s.step_name.replace(/\s+/g, '_').toLowerCase(),
                              name: s.step_name,
                              duration: s.duration_ms,
                              start: start,
                              tokens: s.token_usage || Math.round(s.duration_ms * 4.5 + 400),
                              cost: s.cost || (s.duration_ms * 0.0000008),
                              color: color,
                              status: s.status || "COMPLETED",
                              inputs: (() => {
                                if (reviewDetails && reviewDetails.agentOutputs) {
                                  const key = s.step_name.toLowerCase();
                                  const matchingAo = reviewDetails.agentOutputs.find(ao => 
                                    ao.agentName.toLowerCase().includes(key.replace("_agent", "")) ||
                                    key.includes(ao.agentName.toLowerCase())
                                  )
                                  if (matchingAo) return { prompt: matchingAo.prompt }
                                }
                                return { scope: "standard analysis node run" }
                              })(),
                              outputs: (() => {
                                if (reviewDetails && reviewDetails.agentOutputs) {
                                  const key = s.step_name.toLowerCase();
                                  const matchingAo = reviewDetails.agentOutputs.find(ao => 
                                    ao.agentName.toLowerCase().includes(key.replace("_agent", "")) ||
                                    key.includes(ao.agentName.toLowerCase())
                                  )
                                  if (matchingAo) return { response: matchingAo.response }
                                }
                                return { status: "PROCESSED", output_findings_count: s.findings_count || 0 }
                              })(),
                            };
                          });
 
                      const maxTime = totalDuration > 0 ? totalDuration : 1;
 
                      return (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {stepsToRender.map((step, idx) => {
                              const leftPct = (step.start / maxTime) * 80;
                              const widthPct = Math.max((step.duration / maxTime) * 100, 3);
                              const isStepExpanded = expandedStep === idx;
                              
                              return (
                                <div key={idx} className="space-y-2">
                                  <div 
                                    onClick={() => setExpandedStep(isStepExpanded ? null : idx)}
                                    className={`flex items-center text-[11px] gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors ${
                                      isStepExpanded ? "bg-[#09090b] border border-slate-800" : ""
                                    }`}
                                  >
                                    <div className="w-44 font-semibold text-slate-300 truncate flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a1f]" />
                                      {step.name}
                                    </div>
                                    <div className="flex-1 bg-slate-950 h-5 rounded-md relative overflow-hidden border border-slate-900">
                                      <div 
                                        className={`absolute top-0 bottom-0 rounded-md bg-gradient-to-r ${step.color} opacity-85 hover:opacity-100 transition-all flex items-center justify-between px-2 text-[8px] font-black text-white`}
                                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                      >
                                        <span>{step.duration}ms</span>
                                      </div>
                                    </div>
                                    <div className="w-40 text-right text-slate-400 font-mono flex items-center justify-end gap-2 text-[10px]">
                                      <span className="text-orange-400 flex items-center gap-0.5">
                                        <CpuIcon className="w-2.5 h-2.5" />
                                        {step.tokens}
                                      </span>
                                      <span>•</span>
                                      <span className="text-emerald-450">
                                        ${step.cost.toFixed(5)}
                                      </span>
                                    </div>
                                  </div>
 
                                  {/* Step details dropdown */}
                                  {isStepExpanded && (
                                    <div className="ml-6 p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3 animate-in slide-in-from-top-1 duration-200">
                                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                        <div className="space-y-1.5">
                                          <div className="text-[10px] text-slate-500 uppercase font-black">Node Inputs</div>
                                          <pre className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] text-slate-350 overflow-x-auto whitespace-pre-wrap select-all max-h-64">
                                            {step.inputs.prompt || JSON.stringify(step.inputs, null, 2)}
                                          </pre>
                                        </div>
                                        <div className="space-y-1.5">
                                          <div className="text-[10px] text-slate-500 uppercase font-black">Node Outputs</div>
                                          <pre className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] text-slate-350 overflow-x-auto whitespace-pre-wrap select-all max-h-64">
                                            {step.outputs.response || JSON.stringify(step.outputs, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Legend / Timeline timeline markers */}
                          <div className="flex justify-between border-t border-slate-900 pt-3 text-[9px] font-mono text-slate-500 pl-48">
                            <span>0ms</span>
                            <span>{Math.round(maxTime / 4)}ms</span>
                            <span>{Math.round(maxTime / 2)}ms</span>
                            <span>{Math.round(maxTime * 0.75)}ms</span>
                            <span>{maxTime}ms</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Dynamic Milestone logs */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      Trace Pipeline Event Logs
                    </h3>

                    <div className="space-y-3.5 text-xs text-slate-400 font-medium">
                      {selectedReview.steps && selectedReview.steps.length > 0 ? (
                        (() => {
                          let accumulatedStart = 0;
                          return selectedReview.steps.map((s, idx) => {
                            const step = {
                              name: s.step_name,
                              duration: s.duration_ms,
                              tokens: s.token_usage || Math.round(s.duration_ms * 4.5 + 400),
                              status: s.status || "COMPLETED"
                            };
                            const isCompleted = step.status === "COMPLETED";
                            const icon = step.name.toLowerCase().includes("rag") || step.name.toLowerCase().includes("retrieval")
                              ? <Database className="w-3.5 h-3.5" />
                              : step.name.toLowerCase().includes("validator") || step.name.toLowerCase().includes("ingest") || step.name.toLowerCase().includes("prepare")
                                ? <GitPullRequest className="w-3.5 h-3.5" />
                                : step.name.toLowerCase().includes("synthesiz") || step.name.toLowerCase().includes("summary")
                                  ? <Award className="w-3.5 h-3.5" />
                                  : <Cpu className="w-3.5 h-3.5" />;
                            
                            const colorClass = step.name.toLowerCase().includes("rag") || step.name.toLowerCase().includes("retrieval")
                              ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
                              : step.name.toLowerCase().includes("validator") || step.name.toLowerCase().includes("ingest") || step.name.toLowerCase().includes("prepare")
                                ? "text-[#ff5a1f] bg-[#ff5a1f]/10 border-[#ff5a1f]/20"
                                : step.name.toLowerCase().includes("synthesiz") || step.name.toLowerCase().includes("summary")
                                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                  : "text-blue-500 bg-blue-500/10 border-blue-500/20";

                            return (
                              <div key={idx} className="flex gap-4 items-start">
                                <div className={`p-1 border rounded mt-0.5 ${colorClass}`}>
                                  {icon}
                                </div>
                                <div className="space-y-0.5 flex-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-white">{step.name}</span>
                                    <span className={`text-[9px] font-mono ${isCompleted ? "text-emerald-400" : "text-amber-400"}`}>
                                      {step.status}
                                    </span>
                                  </div>
                                  <p className="leading-normal">
                                    Execution step finished in <span className="text-white font-semibold">{step.duration}ms</span> using <span className="text-orange-400 font-semibold">{step.tokens} tokens</span>.
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        })()
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-550 border border-dashed border-slate-900 rounded-xl">
                          No event logs available for this review trace.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-96 border border-dashed border-slate-900 rounded-2xl flex flex-col justify-center items-center text-center p-8 bg-[#09090b]/20 backdrop-blur-md">
                  <p className="text-slate-500 text-sm">Select an execution trace from the left panel to begin auditing.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  )
}
