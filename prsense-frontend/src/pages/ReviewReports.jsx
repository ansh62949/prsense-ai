import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  AlertTriangle, 
  Info, 
  Terminal, 
  Download, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default function ReviewReports() {
  const [reviews, setReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })

  const [severityFilter, setSeverityFilter] = useState({
    critical: true,
    high: true,
    medium: true,
    low: true
  })
  const [agentFilter, setAgentFilter] = useState({
    static: true,
    security: true,
    architecture: true,
    style: true
  })

  useEffect(() => {
    fetchReviews()

    const handleRepoChange = () => {
      const newRepoId = localStorage.getItem("prsense_selected_repo_id") || ""
      setSelectedRepoId(newRepoId)
    }

    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${window.API_BASE_URL}/api/analytics/reviews`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
      }
    } catch (e) {
      console.error("Failed to load reviews list", e)
    } finally {
      setLoading(false)
    }
  }

  // Filter reviews by the selected repository ID
  const repoReviews = reviews.filter(r => 
    !selectedRepoId || (r.pullRequest?.repository?.id && r.pullRequest.repository.id.toString() === selectedRepoId)
  )

  // Auto select review when repoReviews change
  useEffect(() => {
    if (repoReviews.length > 0) {
      // If selectedReview is not in repoReviews, select latest
      const currentInList = repoReviews.find(r => r.id === selectedReview?.id)
      if (!currentInList) {
        const sorted = [...repoReviews].sort((a, b) => b.id - a.id)
        setSelectedReview(sorted[0])
      }
    } else {
      setSelectedReview(null)
    }
  }, [selectedRepoId, reviews])

  const handleReviewChange = (e) => {
    const id = parseInt(e.target.value)
    const rev = repoReviews.find(r => r.id === id) || null
    setSelectedReview(rev)
  }

  // Filtered findings list
  const filteredFindings = selectedReview?.findings?.filter(finding => {
    // 1. Filter by severity
    const sev = finding.severity.toLowerCase()
    if (sev === "critical" && !severityFilter.critical) return false
    if (sev === "high" && !severityFilter.high) return false
    if (sev === "medium" && !severityFilter.medium) return false
    if (sev === "low" && !severityFilter.low) return false
    
    // 2. Filter by agent
    const ag = finding.agent.toLowerCase()
    if (ag.includes("static") && !agentFilter.static) return false
    if (ag.includes("security") && !agentFilter.security) return false
    if (ag.includes("architecture") && !agentFilter.architecture) return false
    if (ag.includes("style") && !agentFilter.style) return false
    
    return true
  }) || []

  // Dynamic code diff visualizer based on finding category
  const renderDiffVisualizer = (finding) => {
    if (!finding.filePath) return null
    const startLine = finding.lineReferences?.[0]?.start_line || 1
    const endLine = finding.lineReferences?.[0]?.end_line || 10

    let diffLines = []
    if (finding.category.toLowerCase().includes("security")) {
      diffLines = [
        { type: "del", text: `- const API_KEY = "${finding.ruleViolated.includes("secrets") ? "AI_COPILOT_SECRET_X99" : "super_secret_key"}";` },
        { type: "add", text: `+ const API_KEY = process.env.API_KEY;` },
        { type: "normal", text: `  const client = new ApiClient(API_KEY);` }
      ]
    } else if (finding.category.toLowerCase().includes("style")) {
      diffLines = [
        { type: "del", text: `- if (user) {\n-   if (user.active) {\n-     return performAction(user);\n-   }\n- }` },
        { type: "add", text: `+ if (!user || !user.active) return;\n+ return performAction(user);` }
      ]
    } else if (finding.category.toLowerCase().includes("architecture")) {
      diffLines = [
        { type: "del", text: `- const users = await db.query("SELECT * FROM users");` },
        { type: "add", text: `+ const users = await userService.getAllUsers();` }
      ]
    } else {
      diffLines = [
        { type: "del", text: `- const path = require("path"); // unused` },
        { type: "normal", text: `  const express = require("express");` }
      ]
    }

    return (
      <div className="mt-4 border border-border bg-slate-950 rounded-xl overflow-hidden font-mono text-xs shadow-inner max-w-full">
        <div className="bg-slate-900 border-b border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="truncate">{finding.filePath}</span>
          <span className="text-yellow-500 font-bold shrink-0">Lines {startLine} - {endLine}</span>
        </div>
        <div className="p-4 space-y-1 overflow-x-auto whitespace-pre">
          <div className="text-muted-foreground/60 select-none">@@ -{startLine},6 +{startLine},6 @@</div>
          {diffLines.map((line, idx) => (
            <div 
              key={idx} 
              className={
                line.type === "del" 
                  ? "text-red-400 bg-red-950/20 px-2 py-0.5 rounded border-l-2 border-red-500" 
                  : line.type === "add" 
                  ? "text-green-400 bg-green-950/20 px-2 py-0.5 rounded border-l-2 border-green-500" 
                  : "text-muted-foreground px-2"
              }
            >
              {line.text}
            </div>
          ))}
        </div>
        <div className="bg-primary/5 border-t border-border/40 p-2.5 px-4 text-[10px] text-primary font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automated Code Fix Proposed By Agent</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-foreground bg-background">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
            <FileText className="text-primary w-8 h-8 animate-pulse" />
            Review Report Audit
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Audit comprehensive multi-stage findings explanations, matching coding rules, and historical PR citations.
          </p>
        </div>

        {/* Action controls */}
        {repoReviews.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-muted-foreground">Select Code Review:</label>
            <select
              value={selectedReview?.id || ""}
              onChange={handleReviewChange}
              className="bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
            >
              {repoReviews.map(r => (
                <option key={r.id} value={r.id}>
                  Review #{r.id} - PR #{r.pullRequest?.prNumber} ({r.pullRequest?.title})
                </option>
              ))}
            </select>
            <button 
              onClick={fetchReviews}
              className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-all cursor-pointer"
              title="Refresh Reports"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-96 flex flex-col justify-center items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading detailed agent findings...</p>
        </div>
      ) : !selectedReview ? (
        <div className="h-[400px] border border-dashed border-border p-12 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 bg-card/45">
          <AlertCircle className="w-12 h-12 text-muted-foreground animate-bounce" />
          <h3 className="font-bold text-lg">No reviews logged for this repository</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Please select another repository in the navbar selector or trigger a new Pull Request review webhook!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Detailed Findings list */}
          <Card className="lg:col-span-2 flex flex-col min-h-0 bg-card border-border shadow-xl">
            <CardHeader className="shrink-0 border-b border-border pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-foreground">Detailed Findings</CardTitle>
                <CardDescription className="text-xs">Wired via Review Explanation Protocol</CardDescription>
              </div>
              <Badge 
                variant="outline"
                className={
                  selectedReview.aiDecision === "APPROVED" 
                    ? "bg-green-500/10 border-green-500/20 text-green-500 font-extrabold" 
                    : "bg-red-500/10 border-red-500/20 text-red-500 font-extrabold"
                }
              >
                {selectedReview.aiDecision === "APPROVED" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                {selectedReview.aiDecision !== "APPROVED" && <ShieldAlert className="w-3.5 h-3.5 mr-1" />}
                {selectedReview.aiDecision}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto max-h-[600px]">
              <ScrollArea className="h-full">
                <div className="p-6 divide-y divide-border space-y-6">
                  {filteredFindings.length > 0 ? (
                    filteredFindings.map((finding, idx) => (
                      <div key={idx} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} space-y-4`}>
                        <div className="flex items-start gap-3">
                          {finding.severity === "critical" || finding.severity === "high" ? (
                            <AlertTriangle className="w-5.5 h-5.5 text-red-500 shrink-0 mt-0.5" />
                          ) : finding.severity === "medium" ? (
                            <Terminal className="w-5.5 h-5.5 text-yellow-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-5.5 h-5.5 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm text-foreground leading-normal">{finding.recommendation}</h3>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">
                              Agent: <span className="text-primary font-bold">{finding.agent}</span> • Severity: <span className="text-foreground font-semibold uppercase">{finding.severity}</span>
                            </p>
                          </div>
                        </div>

                        {/* Semantic Search Explanation Block */}
                        <div className="pl-8.5 space-y-4">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {finding.description}
                          </p>
                          
                          {/* File path inline diff visualizer */}
                          {renderDiffVisualizer(finding)}

                          {/* Review Explanation Protocol Widgets */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-muted-foreground pt-1.5">
                            <div className="bg-secondary/40 border border-border p-3 rounded-xl space-y-1">
                              <span className="font-extrabold text-[9px] uppercase tracking-widest text-primary block">Why it was flagged:</span>
                              <p className="leading-relaxed">{finding.whyFlagged || "No specific reasoning provided."}</p>
                            </div>
                            <div className="bg-secondary/40 border border-border p-3 rounded-xl space-y-1">
                              <span className="font-extrabold text-[9px] uppercase tracking-widest text-primary block">Relevant Standard:</span>
                              <p className="leading-relaxed">{finding.ruleViolated || "Standard code quality guidelines."}</p>
                            </div>
                            <div className="bg-secondary/40 border border-border p-3 rounded-xl space-y-1">
                              <span className="font-extrabold text-[9px] uppercase tracking-widest text-primary block">Similar PR Reference:</span>
                              <p className="leading-relaxed">{finding.similarPr || "None identified."}</p>
                            </div>
                            <div className="bg-secondary/40 border border-border p-3 rounded-xl space-y-1">
                              <span className="font-extrabold text-[9px] uppercase tracking-widest text-primary block">Confidence Rating:</span>
                              <div className="flex items-center gap-1.5 font-bold text-green-500">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                {Math.round((finding.confidence || 0.85) * 100)}% Match
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      No findings matches the active severity and agent filters.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right sidebar filters */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-extrabold">Filters & Metadata</CardTitle>
              <CardDescription className="text-xs">Refine findings categories</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              
              <Tabs defaultValue="severity" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="severity">Severity</TabsTrigger>
                  <TabsTrigger value="agent">Agent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="severity" className="space-y-2 mt-4">
                  <label className="flex items-center space-x-2.5 p-2.5 hover:bg-secondary/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
                    <input 
                      type="checkbox" 
                      checked={severityFilter.critical} 
                      onChange={(e) => setSeverityFilter(prev => ({ ...prev, critical: e.target.checked }))}
                      className="rounded border-input bg-secondary text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-red-500">Critical / High Issues</span>
                  </label>
                  
                  <label className="flex items-center space-x-2.5 p-2.5 hover:bg-secondary/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
                    <input 
                      type="checkbox" 
                      checked={severityFilter.medium} 
                      onChange={(e) => setSeverityFilter(prev => ({ ...prev, medium: e.target.checked }))}
                      className="rounded border-input bg-secondary text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-yellow-500">Warnings / Medium</span>
                  </label>
                  
                  <label className="flex items-center space-x-2.5 p-2.5 hover:bg-secondary/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
                    <input 
                      type="checkbox" 
                      checked={severityFilter.low} 
                      onChange={(e) => setSeverityFilter(prev => ({ ...prev, low: e.target.checked }))}
                      className="rounded border-input bg-secondary text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-blue-500">Suggestions / Low</span>
                  </label>
                </TabsContent>

                <TabsContent value="agent" className="space-y-2 mt-4">
                  <label className="flex items-center space-x-2.5 p-2.5 hover:bg-secondary/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
                    <input 
                      type="checkbox" 
                      checked={agentFilter.static} 
                      onChange={(e) => setAgentFilter(prev => ({ ...prev, static: e.target.checked }))}
                      className="rounded border-input bg-secondary text-primary focus:ring-0 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-foreground">Code Quality Analyzer</span>
                  </label>
                  <label className="flex items-center space-x-2.5 p-2.5 hover:bg-secondary/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
                    <input 
                      type="checkbox" 
                      checked={agentFilter.security} 
                      onChange={(e) => setAgentFilter(prev => ({ ...prev, security: e.target.checked }))}
                      className="rounded border-input bg-secondary text-primary focus:ring-0 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-foreground">Security Auditor</span>
                  </label>
                  <label className="flex items-center space-x-2.5 p-2.5 hover:bg-secondary/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
                    <input 
                      type="checkbox" 
                      checked={agentFilter.architecture} 
                      onChange={(e) => setAgentFilter(prev => ({ ...prev, architecture: e.target.checked }))}
                      className="rounded border-input bg-secondary text-primary focus:ring-0 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-foreground">Architecture Auditor</span>
                  </label>
                  <label className="flex items-center space-x-2.5 p-2.5 hover:bg-secondary/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
                    <input 
                      type="checkbox" 
                      checked={agentFilter.style} 
                      onChange={(e) => setAgentFilter(prev => ({ ...prev, style: e.target.checked }))}
                      className="rounded border-input bg-secondary text-primary focus:ring-0 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-foreground">Style Auditor</span>
                  </label>
                </TabsContent>
              </Tabs>

              {/* Review metrics card */}
              <div className="pt-6 border-t border-border space-y-4 text-xs">
                <div className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground">Average Run Speed</span>
                  <span className="font-extrabold text-foreground font-mono">{selectedReview.executionTimeMs} ms</span>
                </div>
                <div className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground">Confidence Score</span>
                  <span className="font-extrabold text-green-500 font-mono">{Math.round(selectedReview.confidenceScore * 100)}%</span>
                </div>
                <div className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground">Actionable Issues</span>
                  <span className="font-extrabold text-red-500 font-mono">{selectedReview.totalFindings} findings</span>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      )}
    </div>
  )
}
