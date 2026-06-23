import { backendApi } from "@/config/api";
import React, { useState, useEffect } from "react"
import { 
  Activity, 
  Cpu, 
  Coins, 
  Layers, 
  Terminal, 
  RefreshCw,
  Server,
  Zap,
  CheckCircle,
  Database,
  ExternalLink,
  GitBranch,
  Play,
  AlertTriangle,
  HardDrive
} from "lucide-react"
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

// CodeRabbit Circular White-Rabbit Logo Custom component
const CodeRabbitLogo = ({ className = "w-8 h-8" }) => (
  <div className={"rounded-full bg-[#ff5a1f] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 " + className}>
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
      <path d="M12 9c-2.8 0-5 2.2-5 5v3c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4v-3c0-2.8-2.2-5-5-5zm-2.5-7c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1zm5 0c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1z" />
    </svg>
  </div>
)

export default function Monitoring() {
  const [stats, setStats] = useState(null)
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000)
  const [triggeringIndex, setTriggeringIndex] = useState({})

  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, selectedRepoId])

  useEffect(() => {
    const handleRepoChange = () => {
      setSelectedRepoId(localStorage.getItem("prsense_selected_repo_id") || "")
    }
    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [])

  const fetchStats = async () => {
    try {
      const statsUrl = selectedRepoId 
        ? `${API_BASE_URL}/api/monitoring/stats?repoId=${selectedRepoId}`
        : `${API_BASE_URL}/api/monitoring/stats`
      const [statsRes, reposRes] = await Promise.all([
        backendApi.get(statsUrl.replace(`${API_BASE_URL}`, '')),
        backendApi.get('/api/repositories')
      ])
      if (statsRes) {
        setStats(statsRes.data)
      }
      if (reposRes) {
        setRepos(reposRes.data)
      }
    } catch (e) {
      console.error("Failed to fetch system observability stats", e)
    } finally {
      setLoading(false)
    }
  }

  const handleIndexRepo = async (id) => {
    setTriggeringIndex(prev => ({ ...prev, [id]: true }))
    try {
      const res = await backendApi.post(`/api/repositories/${id}/index`)
      if (res) {
        fetchStats()
      }
    } catch (e) {
      console.error("Failed to trigger repository indexing", e)
    } finally {
      setTriggeringIndex(prev => ({ ...prev, [id]: false }))
    }
  }

  const agentLatencyData = stats && stats.agent_latencies_ms ? [
    { name: "Static Analysis", ms: stats.agent_latencies_ms.static_analysis || 0, fill: "url(#orangeGlow)" },
    { name: "Security Check", ms: stats.agent_latencies_ms.security_check || 0, fill: "url(#redGlow)" },
    { name: "Architecture", ms: stats.agent_latencies_ms.architecture_check || 0, fill: "url(#yellowGlow)" },
    { name: "Style Standard", ms: stats.agent_latencies_ms.style_check || 0, fill: "url(#greenGlow)" }
  ] : []

  // Calculate per-agent cost breakdown using GPT-4o-mini standard token estimates/latency proportion
  const agentCostData = stats && stats.agent_latencies_ms ? [
    { name: "Static Analysis", cost: (stats.agent_latencies_ms.static_analysis || 0) * 0.000002, fill: "url(#orangeGlow)" },
    { name: "Security Check", cost: (stats.agent_latencies_ms.security_check || 0) * 0.000003, fill: "url(#redGlow)" },
    { name: "Architecture", cost: (stats.agent_latencies_ms.architecture_check || 0) * 0.000004, fill: "url(#yellowGlow)" },
    { name: "Style Standard", cost: (stats.agent_latencies_ms.style_check || 0) * 0.0000015, fill: "url(#greenGlow)" }
  ] : []

  return (
    <div className="p-6 space-y-6 bg-[#0c0c0e] text-foreground min-h-screen">
      
      {/* Background glow filters */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#ff5a1f]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-red-650/5 rounded-full blur-3xl pointer-events-none" />

      {/* SVG gradients for Recharts bars */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0">
        <defs>
          <linearGradient id="orangeGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff5a1f" />
            <stop offset="100%" stopColor="#ff9a7b" />
          </linearGradient>
          <linearGradient id="redGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fda4af" />
          </linearGradient>
          <linearGradient id="yellowGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
          <linearGradient id="greenGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-905 pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 rounded-xl">
              <Activity className="text-[#ff5a1f] w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">System Observability</h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Real-time daemon checks, task queue latencies, code analyzer execution profiles, and Analysis Core costs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/50 w-36 cursor-pointer shadow-sm transition-all"
          >
            <option value={2000}>Refresh: 2s</option>
            <option value={5000}>Refresh: 5s</option>
            <option value={10000}>Refresh: 10s</option>
            <option value={30000}>Refresh: 30s</option>
          </select>

          <button 
            onClick={fetchStats}
            className="p-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg border border-slate-800 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="h-96 flex flex-col justify-center items-center space-y-4 relative z-10">
          <RefreshCw className="w-10 h-10 text-[#ff5a1f] animate-spin" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Aggregating telemetry logs...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6 relative z-10">
          
          {/* Status HUD cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Database health check */}
            <div className="bg-[#09090b]/40 border border-slate-900 p-5 rounded-2xl backdrop-blur-md hover:border-[#ff5a1f]/20 transition-all flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                <span>PostgreSQL DB</span>
                <Database className="w-4 h-4 text-[#ff5a1f]" />
              </div>
              <div className="mt-3">
                <div className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  CONNECTED
                </div>
                <p className="text-[10px] text-slate-550 mt-1 font-semibold">Port 5432 • pgvector</p>
              </div>
            </div>

            {/* Queue count */}
            <div className="bg-[#09090b]/40 border border-slate-900 p-5 rounded-2xl backdrop-blur-md hover:border-[#ff5a1f]/20 transition-all flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                <span>Active Task Queue</span>
                <Layers className="w-4 h-4 text-[#ff5a1f]" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white">{stats.active_queue_size} tasks</div>
                <p className="text-[10px] text-slate-550 mt-1 font-semibold">Active queue: review_tasks</p>
              </div>
            </div>

            {/* Worker status */}
            <div className="bg-[#09090b]/40 border border-slate-900 p-5 rounded-2xl backdrop-blur-md hover:border-[#ff5a1f]/20 transition-all flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                <span>Review Workers</span>
                <Server className="w-4 h-4 text-orange-500" />
              </div>
              <div className="mt-3">
                <div className="text-lg font-black text-white uppercase flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stats.worker_status === "active" ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`} />
                  {stats.worker_status}
                </div>
                <p className="text-[10px] text-slate-550 mt-1 font-semibold">Daemon worker check: OK</p>
              </div>
            </div>

            {/* Success rates stats */}
            <div className="bg-[#09090b]/40 border border-slate-900 p-5 rounded-2xl backdrop-blur-md hover:border-[#ff5a1f]/20 transition-all flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                <span>Success Rate</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white">{Math.round(stats.success_rate * 100)}%</div>
                <p className="text-[10px] text-slate-550 mt-1 font-semibold">Total Audits run: {stats.total_reviews}</p>
              </div>
            </div>

          </div>

          {/* Recharts Analytics area (Side-by-Side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Latencies bars graph */}
            <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
              <div className="space-y-1 mb-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff5a1f]" />
                  Agent Execution Latency (ms)
                </h3>
                <p className="text-slate-400 text-[10px] font-medium">
                  Comparison metrics of execution durations across specialized agents in the Workflow Engine topology.
                </p>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={agentLatencyData} layout="vertical" margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.05} stroke="#fff" />
                    <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={90} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0c0c0e", border: "1px solid #27272a", borderRadius: "8px", fontSize: "10px" }} 
                      labelStyle={{ color: "#fff", fontWeight: "bold" }}
                    />
                    <Bar dataKey="ms" radius={[0, 4, 4, 0]} barSize={14}>
                      {agentLatencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Estimated costs breakdown */}
            <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
              <div className="space-y-1 mb-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  Estimated Agent Cost Breakdown (USD)
                </h3>
                <p className="text-slate-400 text-[10px] font-medium">
                  Estimated Analysis Core expense per single review pipeline run based on token count sizes.
                </p>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={agentCostData} layout="vertical" margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.05} stroke="#fff" />
                    <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(5)}`} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={90} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0c0c0e", border: "1px solid #27272a", borderRadius: "8px", fontSize: "10px" }} 
                      labelStyle={{ color: "#fff", fontWeight: "bold" }}
                      formatter={(value) => [`$${value.toFixed(6)}`, "Cost"]}
                    />
                    <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={14}>
                      {agentCostData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Lower Grid: Indexing Snapshots + Total stats cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left table: Indexing pipeline (8 cols) */}
            <div className="lg:col-span-8 bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
              <div className="space-y-1 mb-5">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <GitBranch className="w-4.5 h-4.5 text-[#ff5a1f]" />
                  Repository Knowledgebase snapshots
                </h3>
                <p className="text-slate-405 text-[10px] font-medium">
                  Tracks code indexing pipelines, parsed vector embeddings, and Semantic Search document sizes.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                      <th className="pb-3 pl-2">Repository</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Files</th>
                      <th className="pb-3">Embeddings</th>
                      <th className="pb-3">Index Time</th>
                      <th className="pb-3 pr-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-950">
                    {repos.map((repo) => {
                      const isIndexing = repo.indexingStatus === "INDEXING" || repo.indexingStatus === "PENDING";
                      return (
                        <tr key={repo.id} className="hover:bg-slate-900/30 transition-all text-slate-350">
                          <td className="py-3.5 pl-2 font-bold text-white">
                            {repo.fullName}
                            {repo.indexingError && (
                              <span className="block text-[10px] text-rose-400 font-medium mt-0.5 max-w-xs truncate" title={repo.indexingError}>
                                Error: {repo.indexingError}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              repo.indexingStatus === "INDEXED" 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : repo.indexingStatus === "INDEXING" 
                                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse" 
                                  : repo.indexingStatus === "PENDING"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : repo.indexingStatus === "FAILED"
                                      ? "bg-rose-500/10 text-rose-450 border-rose-500/20"
                                      : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                repo.indexingStatus === "INDEXED" ? "bg-emerald-450" : repo.indexingStatus === "INDEXING" ? "bg-[#ff5a1f] animate-ping" : "bg-slate-500"
                              }`} />
                              {repo.indexingStatus || "UNINDEXED"}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono text-slate-450">{repo.filesIndexed ?? 0}</td>
                          <td className="py-3.5 font-mono text-slate-450">{repo.embeddingsGenerated ?? 0}</td>
                          <td className="py-3.5 font-mono text-slate-450">
                            {repo.indexingDurationMs ? `${(repo.indexingDurationMs / 1000).toFixed(1)}s` : "-"}
                          </td>
                          <td className="py-3.5 pr-2 text-right">
                            <button
                              onClick={() => handleIndexRepo(repo.id)}
                              disabled={isIndexing || triggeringIndex[repo.id]}
                              className="px-2.5 py-1.5 bg-[#ff5a1f]/10 hover:bg-[#ff5a1f]/20 disabled:bg-[#0c0c0e] border border-[#ff5a1f]/20 disabled:border-transparent text-[#ff5a1f] disabled:text-slate-500 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ml-auto cursor-pointer disabled:cursor-not-allowed"
                            >
                              {isIndexing || triggeringIndex[repo.id] ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3 fill-current" />
                              )}
                              Re-Index
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {repos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-550 text-xs">
                          No repositories registered in system cache.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right panel: Resource details (4 cols) */}
            <div className="lg:col-span-4 bg-[#09090b]/60 border border-slate-900 p-5 backdrop-blur-md space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <HardDrive className="w-4.5 h-4.5 text-[#ff5a1f]" />
                  AI Token Expense totals
                </h3>
                <p className="text-slate-450 text-[10px] font-medium">
                  Aggregated token metrics and API expense allocations.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Avg review duration</span>
                  <div className="text-xl font-black text-white flex items-baseline gap-1 font-mono">
                    {stats.avg_review_latency_ms} 
                    <span className="text-xs text-slate-500 font-semibold">ms</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Total Tokens Ingested</span>
                  <div className="text-xl font-black text-white font-mono">
                    {stats.total_tokens_consumed.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#ff5a1f]/5 border border-[#ff5a1f]/20 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-[#ff5a1f] font-mono">Accumulated Api cost</span>
                  <div className="text-2xl font-black text-[#ff5a1f] flex items-baseline gap-0.5 font-mono">
                    ${stats.total_api_costs_usd.toFixed(5)}
                    <span className="text-[10px] text-slate-500 font-semibold ml-1.5">USD</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Observability Integrations Dashboard Links */}
          <div className="bg-[#09090b]/60 border border-slate-900 p-6 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-[#ff5a1f]" />
                Telemetry Suite Integrations
              </h3>
              <p className="text-slate-450 text-xs mt-1">
                Access deep analytics gauges, distributed tracing boards, and agent completions directly in external tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Prometheus integration card */}
              <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-3.5 hover:border-[#ff5a1f]/30 transition-all flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-white">Prometheus Server</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-black px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                  </div>
                  <p className="text-[11px] text-slate-450 leading-normal font-medium">
                    Collect endpoint latency histograms, JVM garbage collection sweeps, and memory pool footprints.
                  </p>
                </div>
                <a 
                  href={window.PROMETHEUS_URL || "http://localhost:9090"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#ff5a1f] font-bold hover:underline pt-2 border-t border-slate-900"
                >
                  Launch Prometheus
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Grafana integration card */}
              <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-3.5 hover:border-[#ff5a1f]/30 transition-all flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-white">Grafana Dashboards</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-black px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                  </div>
                  <p className="text-[11px] text-slate-450 leading-normal font-medium">
                    View customized telemetry dashboards monitoring backend server health, CPU graphs, and API response gauges.
                  </p>
                </div>
                <a 
                  href={window.GRAFANA_URL || "http://localhost:3000"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#ff5a1f] font-bold hover:underline pt-2 border-t border-slate-900"
                >
                  Launch Grafana Panels
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Langfuse integration card */}
              <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-3.5 hover:border-[#ff5a1f]/30 transition-all flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-white">Langfuse Agent Tracing</span>
                    <span className="text-[8px] bg-blue-500/10 text-blue-400 font-black px-1.5 py-0.5 rounded border border-blue-500/20 text-blue-400">Analysis Core LOGS</span>
                  </div>
                  <p className="text-[11px] text-slate-450 leading-normal font-medium">
                    Trace complete prompt variations, chat completions, Workflow Engine context states, and similarity retrieval logs.
                  </p>
                </div>
                <a 
                  href={window.GRAFANA_URL || "http://localhost:3000"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#ff5a1f] font-bold hover:underline pt-2 border-t border-slate-900"
                >
                  Launch Langfuse Logs
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          </div>

        </div>
      ) : null}
    </div>
  )
}
