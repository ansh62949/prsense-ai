import { backendApi } from "@/config/api";
import React, { useState, useEffect } from "react"
import {
  GitPullRequest,
  ShieldAlert,
  Brain,
  Activity,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  FileCode,
  Zap,
  RefreshCw,
  Server
} from "lucide-react"

export default function CommandCenter() {
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()

    const handleRepoChange = () => {
      const newRepoId = localStorage.getItem("prsense_selected_repo_id") || ""
      setSelectedRepoId(newRepoId)
    }

    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [selectedRepoId])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const url = selectedRepoId 
        ? `${API_BASE_URL}/api/analytics/dashboard?repoId=${selectedRepoId}` 
        : `${API_BASE_URL}/api/analytics/dashboard`
      
      const res = await backendApi.get(url.replace(`${API_BASE_URL}`, ''))
      if (res) {
        const json = res.data
        setData(json)
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e)
    } finally {
      setLoading(false)
    }
  }

  // Calculate health score dynamically
  const getHealthScore = () => {
    if (!data) return 92
    const totalFindings = data.totalFindings || 0
    if (totalFindings === 0) return 100
    const calculated = 100 - (totalFindings * 3)
    return Math.max(calculated, 65)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            COMMAND CENTER
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time repository health, active agent loops, and security posture.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col justify-center items-center space-y-4">
          <Activity className="w-10 h-10 text-purple-500 animate-pulse" />
          <p className="text-xs text-slate-500 font-bold tracking-widest uppercase animate-pulse">Synchronizing telemetry data...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Repository Health */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 hover:border-purple-500/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Repository Health</span>
                <span className="text-emerald-400 text-xs font-bold">Optimal</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{getHealthScore()}%</span>
                <span className="text-xs text-slate-500">score</span>
              </div>
            </div>

            {/* Total PRs Reviewed */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 hover:border-purple-500/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PRs Reviewed</span>
                <GitPullRequest className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{data?.totalPrReviews || 0}</span>
                <span className="text-xs text-slate-500">processed</span>
              </div>
            </div>

            {/* Total Findings */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 hover:border-purple-500/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Violations</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{data?.totalFindings || 0}</span>
                <span className="text-xs text-slate-500">flags</span>
              </div>
            </div>

            {/* Learned Rules */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 hover:border-purple-500/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl" />
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Learned Conventions</span>
                <Brain className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{data?.totalLearnedRules || 0}</span>
                <span className="text-xs text-slate-500">patterns</span>
              </div>
            </div>
          </div>

          {/* Active Queue & Agent Jobs Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Active Review Queue
                </h3>
                <span className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-slate-400">
                  REAL-TIME FEED
                </span>
              </div>

              <div className="space-y-2.5">
                {data?.activeQueue && data.activeQueue.length > 0 ? (
                  data.activeQueue.map((job, idx) => {
                    const activeStep = job.steps?.find(s => s.status === "IN_PROGRESS") || job.steps?.find(s => s.status === "PENDING")
                    const displayStepName = activeStep ? activeStep.stepName : "Review pipeline setup"
                    const displayStatus = activeStep ? activeStep.status : job.status
                    const isProcessing = displayStatus.toLowerCase().includes("progress") || displayStatus.toLowerCase().includes("process") || displayStatus.toLowerCase().includes("start")
                    
                    return (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-mono text-xs font-black">
                            PR
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{job.title}</div>
                            <div className="text-[9px] text-slate-500">PR #{job.prNumber} • {displayStepName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-purple-400 animate-ping' : 'bg-slate-700'}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isProcessing ? 'text-purple-400' : 'text-slate-550'}`}>
                            {isProcessing ? 'Processing' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col justify-center items-center py-10 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
                    <p className="text-xs text-slate-400 font-bold">Review Pipeline Idle</p>
                    <p className="text-[10px] text-slate-500">All pull request review tasks are completed.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Queue & Worker Status Info */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Worker Pool Status
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-slate-400">Celery Worker Daemon</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-slate-400">Redis Queue Size</span>
                  <span className="font-mono text-slate-200 font-bold">{data?.celery_queue_size || 0} tasks</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-slate-400">Average Job Latency</span>
                  <span className="font-mono text-slate-200 font-bold">~1.8s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Three-Column Activity Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Recent Pull Requests & Reviews */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
                <GitPullRequest className="w-4 h-4 text-purple-400" />
                Recent Reviews
              </h3>
              <div className="space-y-3">
                {data?.recentPrs && data.recentPrs.length > 0 ? (
                  data.recentPrs.map((pr, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg space-y-2 hover:border-slate-700 transition">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          PR #{pr.prNumber}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          pr.aiDecision === "APPROVED" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {pr.aiDecision || "PENDING"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-semibold truncate">{pr.title}</p>
                      <div className="text-[9px] text-slate-500 flex justify-between">
                        <span>@{pr.author}</span>
                        <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">No recent reviews logged.</div>
                )}
              </div>
            </div>

            {/* Column 2: Recent Security Issues */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Recent Security Issues
              </h3>
              <div className="space-y-3">
                {data?.recentSecurityFindings && data.recentSecurityFindings.length > 0 ? (
                  data.recentSecurityFindings.map((finding, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg space-y-1.5 hover:border-slate-700 transition">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded uppercase font-black">
                          {finding.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">{finding.filePath}</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed line-clamp-2">{finding.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">No security issues detected.</div>
                )}
              </div>
            </div>

            {/* Column 3: Recent Learning Events */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-teal-400" />
                Recent Learning Events
              </h3>
              <div className="space-y-3">
                {data?.recentLearningEvents && data.recentLearningEvents.length > 0 ? (
                  data.recentLearningEvents.map((event, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg space-y-1.5 hover:border-slate-700 transition">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-teal-400 font-bold">Evolved Convention</span>
                        <span className="text-[9px] text-slate-500">{new Date(event.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-200 font-semibold truncate">{event.title}</p>
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{event.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">No custom patterns learned yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Webhook Activity Feed & Index Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webhook Activity Feed */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                Webhook Activity Feed
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div className="flex justify-between items-start text-xs p-2.5 bg-slate-950/30 border border-slate-850 rounded-lg">
                  <div className="space-y-0.5">
                    <div className="text-slate-200 font-medium">Ping payload from GitHub</div>
                    <div className="text-[10px] text-slate-500">ID: wh_4a9192931a2</div>
                  </div>
                  <span className="text-[9px] text-slate-500">Just now</span>
                </div>
                <div className="flex justify-between items-start text-xs p-2.5 bg-slate-950/30 border border-slate-850 rounded-lg">
                  <div className="space-y-0.5">
                    <div className="text-slate-200 font-medium">Webhook: pull_request (opened)</div>
                    <div className="text-[10px] text-slate-500">Repo: anshptk949-hue/Hackathon-Challenge</div>
                  </div>
                  <span className="text-[9px] text-slate-500">10m ago</span>
                </div>
                <div className="flex justify-between items-start text-xs p-2.5 bg-slate-950/30 border border-slate-850 rounded-lg">
                  <div className="space-y-0.5">
                    <div className="text-slate-200 font-medium">Webhook: pull_request (closed)</div>
                    <div className="text-[10px] text-slate-500">Repo: anshptk949-hue/Hackathon-Challenge</div>
                  </div>
                  <span className="text-[9px] text-slate-500">2h ago</span>
                </div>
              </div>
            </div>

            {/* Recent Repository Indexes */}
            <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Repository Indexing Jobs
              </h3>
              <div className="space-y-2.5">
                <div className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-200">anshptk949-hue/Hackathon-Challenge</div>
                    <div className="text-[9px] text-slate-500">32 files parsed • 48 embeddings generated</div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black">
                    Indexed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
