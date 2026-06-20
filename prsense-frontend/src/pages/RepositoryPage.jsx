import { API_BASE_URL } from "@/config/api";
import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import {
  GitBranch,
  GitFork,
  Star,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Code,
  TrendingUp,
  Radio,
  Brain,
  Layers,
  Database,
  ArrowLeft,
  RefreshCw,
  GitPullRequest,
  Activity
} from "lucide-react"

export default function RepositoryPage() {
  const { repoId } = useParams()
  const [repo, setRepo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [indexing, setIndexing] = useState(false)
  const [recentPRs, setRecentPRs] = useState([])
  const [recentFindings, setRecentFindings] = useState([])

  useEffect(() => {
    fetchRepository()
  }, [repoId])

  const fetchRepository = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/repositories/${repoId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setRepo(data)
      }

      // Fetch dashboard metrics to get recent PRs and findings
      const dashRes = await fetch(`${API_BASE_URL}/api/analytics/dashboard?repoId=${repoId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (dashRes.ok) {
        const dashData = await dashRes.json()
        setRecentPRs(dashData.recentPrs || [])
        setRecentFindings(dashData.recentSecurityFindings || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleIndexRepository = async () => {
    setIndexing(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/repositories/${repoId}/index`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const updated = await res.json()
        setRepo(updated)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIndexing(false)
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex flex-col justify-center items-center space-y-4">
        <Activity className="w-10 h-10 text-purple-500 animate-pulse" />
        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase animate-pulse">Loading Repository Workspace...</p>
      </div>
    )
  }

  if (!repo) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Repository Not Found</h2>
        <p className="text-slate-400">Could not find repository metadata for ID {repoId}.</p>
        <Link to="/repositories" className="inline-flex items-center gap-1 text-purple-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Repositories
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">{repo.fullName}</h1>
          <p className="text-xs text-slate-400 max-w-2xl">{repo.description || "No description provided."}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:text-white hover:border-slate-700 text-xs font-bold transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> View on GitHub
          </a>
          <button
            onClick={fetchRepository}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Primary Language", value: repo.language || "Java", icon: Code, color: "text-purple-400" },
          { label: "Stars", value: repo.stars || 0, icon: Star, color: "text-amber-400" },
          { label: "Forks", value: repo.forks || 0, icon: GitFork, color: "text-blue-400" },
          { label: "Open Pull Requests", value: repo.openPrCount || 0, icon: GitBranch, color: "text-cyan-400" },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Architecture Health */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                Architecture Health Profile
              </h3>
              <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                Healthy
              </span>
            </div>
            <div className="space-y-4">
              {[
                { name: "Domain Modularity", score: 94, color: "from-purple-500 to-indigo-500" },
                { name: "Static Code Compliance", score: 88, color: "from-blue-500 to-cyan-500" },
                { name: "Security Vulnerabilities", score: 96, color: "from-emerald-500 to-teal-500" },
                { name: "Code Formatting & Style", score: 90, color: "from-amber-500 to-orange-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-white font-bold">{item.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews List */}
          <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2">
              Recent Repository Reviews
            </h3>
            <div className="space-y-3">
              {recentPRs.length > 0 ? (
                recentPRs.map((pr, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-slate-700 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                          PR #{pr.prNumber}
                        </span>
                        <span className="text-xs font-bold text-white">{pr.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Author: @{pr.author} • {new Date(pr.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      pr.aiDecision === "APPROVED" ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    }`}>
                      {pr.aiDecision}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">No reviews recorded yet. Run a webhook check or index first.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Statuses */}
        <div className="space-y-6">
          {/* Indexing console */}
          <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              Repository Indexing
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-400">Index Status</span>
                <span className={`font-bold ${repo.indexingStatus === "INDEXED" ? "text-green-400" : "text-amber-400"}`}>
                  {repo.indexingStatus || "PENDING"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-400">Indexed Files</span>
                <span className="font-mono text-slate-200 font-bold">{repo.filesIndexed || 0} files</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-400">Embeddings</span>
                <span className="font-mono text-slate-200 font-bold">{repo.embeddingsGenerated || 0} vectors</span>
              </div>
              {repo.lastIndexedAt && (
                <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-slate-400">Last Indexed</span>
                  <span className="text-slate-200 font-medium">{new Date(repo.lastIndexedAt).toLocaleString()}</span>
                </div>
              )}
              <button
                onClick={handleIndexRepository}
                disabled={indexing || repo.indexingStatus === "INDEXING"}
                className="w-full mt-2 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {indexing || repo.indexingStatus === "INDEXING" ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Indexing codebase...
                  </>
                ) : (
                  "Trigger Reindex"
                )}
              </button>
            </div>
          </div>

          {/* Webhook Connection */}
          <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              Webhook Integration
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-xs text-emerald-400 font-bold">HEALTHY / ACTIVE</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Direct webhook configured to monitor commits, branches, and new pull request creations automatically.
            </p>
          </div>

          {/* Learning Status */}
          <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-teal-400" />
              Evolving Conventions
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-400">Rules Extracted</span>
                <span className="font-mono text-slate-200 font-bold">24 rules</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-400">Last Pattern Learned</span>
                <span className="text-slate-200 font-medium">3h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
