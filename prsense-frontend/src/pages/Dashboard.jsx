import { backendApi } from "@/config/api";
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Activity, 
  ShieldAlert, 
  GitPullRequest, 
  GitBranch, 
  Box, 
  Cpu, 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  TrendingUp,
  BrainCircuit
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, Bar, BarChart, CartesianGrid } from "recharts"

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })

  useEffect(() => {
    fetchDashboardMetrics(selectedRepoId)

    const handleRepoChange = () => {
      const newRepoId = localStorage.getItem("prsense_selected_repo_id") || ""
      setSelectedRepoId(newRepoId)
      fetchDashboardMetrics(newRepoId)
    }

    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [])

  const fetchDashboardMetrics = async (repoId) => {
    setLoading(true)
    try {
      const url = repoId 
        ? `${API_BASE_URL}/api/analytics/dashboard?repoId=${repoId}`
        : `${API_BASE_URL}/api/analytics/dashboard`
      const res = await backendApi.get(url.replace(`${API_BASE_URL}`, ''))
      if (res) {
        const data = res.data
        setMetrics(data)
      }
    } catch (e) {
      console.error("Failed to load dashboard metrics", e)
    } finally {
      setLoading(false)
    }
  }

  // Compile category breakdown chart data
  const categoryData = metrics ? [
    { name: "Static", value: metrics.categoryBreakdown["static_analysis"] || 0 },
    { name: "Security", value: metrics.categoryBreakdown["security"] || 0 },
    { name: "Architecture", value: metrics.categoryBreakdown["architecture"] || 0 },
    { name: "Style", value: metrics.categoryBreakdown["style"] || 0 },
  ] : []

  // Combine security and architecture trends for Area Chart
  const trendData = metrics ? metrics.securityTrends.map((t, idx) => {
    const arch = metrics.architectureTrends[idx]
    return {
      week: t.week,
      security: t.violations,
      architecture: arch ? arch.violations : 0
    }
  }) : []

  return (
    <div className="p-6 space-y-6 bg-background text-foreground animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
            <Activity className="text-primary w-8 h-8 animate-pulse" />
            AI Insights Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Auditing repository health, code violation trends, and multi-stage performance metrics.
          </p>
        </div>

        <button 
          onClick={() => fetchDashboardMetrics(selectedRepoId)}
          className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col justify-center items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Aggregating platform metrics & AI performance analytics...</p>
        </div>
      ) : metrics ? (
        metrics.activeRepositories === 0 ? (
          <div className="h-96 border border-dashed border-border p-12 rounded-2xl flex flex-col justify-center items-center text-center space-y-4 max-w-md mx-auto relative z-10 bg-card/10 backdrop-blur-sm mt-12">
            <AlertCircle className="w-12 h-12 text-[#ff5a1f] mx-auto animate-pulse" />
            <h3 className="font-bold text-lg text-white">No Repositories Connected</h3>
            <p className="text-muted-foreground text-sm leading-normal">
              To view AI insights and metrics, you first need to connect a GitHub repository to seed the data engine.
            </p>
            <a
              href="/repositories"
              className="px-4.5 py-2.5 bg-gradient-to-r from-[#ff5a1f] to-[#e04e1b] text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-orange-500/15 transition-all mt-2 inline-block cursor-pointer hover:scale-[1.01]"
            >
              Connect Repository CTA
            </a>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-card/60 backdrop-blur-md hover:border-primary/20 transition-all shadow-md relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Active Repositories</CardTitle>
                <GitBranch className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">{metrics.activeRepositories}</div>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                  GitHub installation synchronized
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/60 backdrop-blur-md hover:border-primary/20 transition-all shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">AI Reviews Run</CardTitle>
                <GitPullRequest className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">{metrics.totalPrReviews}</div>
                <p className="text-[10px] text-green-500 mt-1 font-semibold flex items-center gap-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Average speed: {Math.round(metrics.averageExecutionTimeMs)} ms
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/60 backdrop-blur-md hover:border-primary/20 transition-all shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Learned preferences</CardTitle>
                <BrainCircuit className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">{metrics.totalLearnedRules}</div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">Auto-extracted from merged PR diffs</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/60 backdrop-blur-md hover:border-primary/20 transition-all shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Total Code Findings</CardTitle>
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-500">{metrics.totalFindings}</div>
                <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Confidence rate: {Math.round(metrics.averageConfidence * 100)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            
            {/* Security and Architecture Violation Trends */}
            <Card className="col-span-1 lg:col-span-4 border-border bg-card/60 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-base font-extrabold text-foreground">Code Violation Trends</CardTitle>
                <CardDescription className="text-xs">Security and architecture patterns flags week-over-week</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorArch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="week" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" name="Security Risks" dataKey="security" stroke="#ef4444" fillOpacity={1} fill="url(#colorSec)" />
                    <Area type="monotone" name="Architecture Violations" dataKey="architecture" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorArch)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ingestion & Learning Rules Growth */}
            <Card className="col-span-1 lg:col-span-3 border-border bg-card/60 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-base font-extrabold text-foreground">Active Learner Growth</CardTitle>
                <CardDescription className="text-xs">Count of extracted organizational coding rules stored in pgvector</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.learningTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="week" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" name="Learned Rules" dataKey="rules" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid: Violations Category Breakdown & Live Agents Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            
            {/* Category Breakdown Bar Chart */}
            <Card className="col-span-1 lg:col-span-3 border-border bg-card/60 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-base font-extrabold text-foreground">Violation Category Breakdown</CardTitle>
                <CardDescription className="text-xs">Accumulated issues across review checklists</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                    />
                    <Bar name="Issues count" dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feeds Panel: Tabbed or Multi-Feed View */}
            <Card className="col-span-1 lg:col-span-4 border-border bg-card/60 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-base font-extrabold text-foreground">Live Repository Insights Feed</CardTitle>
                <CardDescription className="text-xs">Recent activity, security warnings, and learned rules</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Feed 1: Recent PRs */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider border-b border-border pb-2">
                      <GitPullRequest className="w-3.5 h-3.5 text-blue-500" />
                      Recent PRs
                    </h4>
                    {metrics.recentPrs && metrics.recentPrs.length > 0 ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {metrics.recentPrs.map((pr, idx) => (
                          <div key={idx} className="p-2 bg-secondary/30 rounded-xl border border-border/40 text-[11px] hover:bg-secondary/50 transition-all">
                            <div className="flex justify-between items-center font-bold text-foreground mb-1">
                              <span>#{pr.prNumber}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] ${pr.aiDecision === 'Approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                {pr.aiDecision || "Reviewed"}
                              </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 leading-snug">{pr.title}</p>
                            <div className="text-[9px] text-muted-foreground/80 mt-1.5 text-right font-medium">
                              by @{pr.author}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No recent pull requests.</p>
                    )}
                  </div>

                  {/* Feed 2: Security Warnings */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-red-500 flex items-center gap-1.5 uppercase tracking-wider border-b border-border pb-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                      Security Risks
                    </h4>
                    {metrics.recentSecurityFindings && metrics.recentSecurityFindings.length > 0 ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {metrics.recentSecurityFindings.map((finding, idx) => (
                          <div key={idx} className="p-2 bg-red-500/5 rounded-xl border border-red-500/10 text-[11px] hover:bg-red-500/10 transition-all">
                            <div className="flex justify-between items-center font-bold text-red-400 mb-1">
                              <span className="truncate max-w-[80px]" title={finding.filePath}>{finding.filePath.split('/').pop()}</span>
                              <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-[8px] uppercase tracking-wider font-extrabold">
                                {finding.severity}
                              </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 leading-snug">{finding.description}</p>
                            <div className="text-[9px] text-red-400/80 mt-1.5 text-right font-semibold">
                              Conf: {Math.round(finding.confidence * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No security warnings found.</p>
                    )}
                  </div>

                  {/* Feed 3: Learned Conventions */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-border pb-2">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                      Learned Rules
                    </h4>
                    {metrics.recentLearningEvents && metrics.recentLearningEvents.length > 0 ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {metrics.recentLearningEvents.map((rule, idx) => (
                          <div key={idx} className="p-2 bg-purple-500/5 rounded-xl border border-purple-500/10 text-[11px] hover:bg-purple-500/10 transition-all">
                            <h5 className="font-bold text-purple-400 truncate mb-1" title={rule.title}>{rule.title}</h5>
                            <p className="text-muted-foreground line-clamp-2 leading-snug">{rule.description}</p>
                            <div className="text-[9px] text-purple-400/80 mt-1.5 text-right font-semibold">
                              Confidence: {Math.round(rule.confidence * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No rules learned yet.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) ) : (
        <div className="h-96 border border-dashed border-border p-12 rounded-2xl flex flex-col justify-center items-center text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-lg">Failed to retrieve metrics</h3>
          <p className="text-muted-foreground text-sm">Please verify the Spring Boot gateway is active and fully connected to FastAPI.</p>
        </div>
      )}
    </div>
  )
}

function AlertCircle({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={2} 
      stroke="currentColor" 
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  )
}
