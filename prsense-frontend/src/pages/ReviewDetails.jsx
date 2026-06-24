import { backendApi } from "@/config/api";
import React, { useState, useEffect } from "react"
import { exportReviewReportToPDF } from "@/lib/pdfExport"
import { useParams, Link } from "react-router-dom"
import { 
  FileText, 
  AlertTriangle, 
  Info, 
  Terminal, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  ChevronLeft,
  MessageSquare,
  Award,
  Database,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ReviewDetails() {
  const { reviewId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [activeTab, setActiveTab] = useState("findings")

  useEffect(() => {
    fetchReviewDetails()
  }, [reviewId])

  const fetchReviewDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.agentOutputs && json.agentOutputs.length > 0) {
          setSelectedAgent(json.agentOutputs[0])
        }
      }
    } catch (e) {
      console.error("Failed to load review details", e)
    } finally {
      setLoading(false)
    }
  }

  const renderDiffVisualizer = (finding) => {
    if (!finding.filePath) return null
    const startLine = finding.lineNumber || 1
    
    let diffLines = []
    const cat = finding.category ? finding.category.toLowerCase() : ""
    if (cat.includes("security")) {
      diffLines = [
        { type: "del", text: `- const API_KEY = "super_secret_key_123";` },
        { type: "add", text: `+ const API_KEY = process.env.API_KEY;` },
        { type: "normal", text: `  const client = new ApiClient(API_KEY);` }
      ]
    } else if (cat.includes("style")) {
      diffLines = [
        { type: "del", text: `- if (user) {\n-   if (user.active) {\n-     return performAction(user);\n-   }\n- }` },
        { type: "add", text: `+ if (!user || !user.active) return;\n+ return performAction(user);` }
      ]
    } else if (cat.includes("architecture")) {
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
      <div className="mt-4 border border-slate-800 bg-[#07090d] rounded-xl overflow-hidden font-mono text-[11px] shadow-inner">
        <div className="bg-slate-900/40 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>{finding.filePath}</span>
          <span className="text-amber-500 font-bold">Line {startLine}</span>
        </div>
        <div className="p-4 space-y-1 overflow-x-auto whitespace-pre">
          {diffLines.map((line, idx) => (
            <div 
              key={idx} 
              className={cn(
                "px-2 py-0.5 rounded border-l-2",
                line.type === "add" && "bg-green-950/20 text-green-400 border-green-500",
                line.type === "del" && "bg-red-950/20 text-red-400 border-l-2 border-red-500",
                line.type === "normal" && "text-slate-500 border-transparent"
              )}
            >
              {line.text}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-96 flex flex-col justify-center items-center space-y-4">
        <Activity className="w-10 h-10 text-purple-500 animate-pulse" />
        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase animate-pulse">Retrieving review metadata...</p>
      </div>
    )
  }

  if (!data || !data.review) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Review Report Not Found</h2>
        <p className="text-slate-400">Could not load details for review ID {reviewId}.</p>
        <Link to="/reviews" className="inline-flex items-center gap-1 text-purple-400 hover:underline text-xs font-bold">
          <ChevronLeft className="w-4 h-4" /> Back to Reviews
        </Link>
      </div>
    )
  }

  const { review, pullRequest, findings, timeline, agentOutputs, filesChanged, githubCommentPreview } = data

  // Calculate cumulative times for Gantt presentation
  let cumulativeTime = 0
  const mappedTimeline = (timeline || []).map(t => {
    const start = cumulativeTime
    cumulativeTime += t.durationMs
    return { ...t, start, end: cumulativeTime }
  })
  const totalDuration = cumulativeTime || 1

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5">
        <Link to="/reviews" className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-200 font-bold tracking-widest uppercase transition-all">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Reviews
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black px-2.5 py-0.5 rounded-lg">
                PR #{pullRequest?.prNumber}
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">{pullRequest?.title}</h1>
            </div>
            <p className="text-xs text-slate-500">
              Analyzed by <span className="text-slate-350 font-bold">PRSense</span> • Author: <span className="font-bold text-slate-300">@{pullRequest?.author}</span> • Job Status: <span className="text-emerald-400 font-bold uppercase">{review.status}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportReviewReportToPDF(review, findings, pullRequest)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 hover:bg-[#ff5a1f]/20 text-[#ff5a1f] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="Download PDF Audit Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <span className={`text-[10px] font-black px-3.5 py-1.5 rounded-full border ${
              review.aiDecision === "APPROVED" 
                ? "bg-green-500/10 border-green-500/20 text-green-400" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              {review.aiDecision}
            </span>

            <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              {review.executionTimeMs} ms
            </span>
          </div>
        </div>
      </div>

      {/* Stats Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Critical Findings", value: findings?.filter(f => f.severity?.toLowerCase() === 'critical' || f.severity?.toLowerCase() === 'high').length || 0, color: "text-rose-400" },
          { label: "Medium Findings", value: findings?.filter(f => f.severity?.toLowerCase() === 'medium').length || 0, color: "text-amber-400" },
          { label: "Low Findings", value: findings?.filter(f => f.severity?.toLowerCase() === 'low' || f.severity?.toLowerCase() === 'info').length || 0, color: "text-emerald-400" },
          { label: "Review Duration", value: `${(review.executionTimeMs / 1000).toFixed(1)}s`, color: "text-cyan-400" },
          { label: "Files Evaluated", value: filesChanged?.length || [...new Set(findings?.map(f => f.filePath))].length || 0, color: "text-white" },
          { label: "Agents Executed", value: "5 (Core)", color: "text-purple-400" }
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-[#0a0e17]/80 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block mb-1">{stat.label}</span>
            <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Findings, Timelines, Agent Outputs) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-800/80 bg-[#0a0e17]/50 px-4 pt-2 rounded-t-xl">
            {[
              { id: "findings", label: "Findings list" },
              { id: "timelines", label: "Gantt Timeline Traces" },
              { id: "prompts", label: "Agent Output Traces" },
              { id: "github", label: "GitHub Comment Markdown" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-xs font-bold border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-purple-500 text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-[#0a0e17]/85 border border-t-0 border-slate-800/80 p-6 rounded-b-xl min-h-[300px]">
            {activeTab === "findings" && (
              <div className="space-y-6">
                {findings?.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">No code violations identified.</div>
                ) : (
                  findings.map((f, idx) => (
                    <div key={idx} className="space-y-3 pb-6 border-b border-slate-850 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                              f.severity === "critical" || f.severity === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/25" : "bg-slate-800 text-slate-400 border border-slate-700"
                            )}>
                              {f.severity}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{f.agent}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white font-mono mt-1">{f.filePath || "unknown"}</h4>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-semibold">{f.recommendation}</p>
                      <p className="text-xs text-slate-400 leading-normal">{f.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] pt-2">
                        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-purple-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Why Flagged</span>
                          <span className="text-slate-400">{f.whyFlagged || "Compliance check"}</span>
                        </div>
                        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-purple-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Relevant Policy</span>
                          <span className="text-slate-400">{f.ruleViolated || "General guidelines"}</span>
                        </div>
                      </div>

                      {renderDiffVisualizer(f)}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "timelines" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gantt Trace Lifecycle</h3>
                  <p className="text-[10px] text-slate-500">Visual mapping of execution times across individual agent nodes.</p>
                </div>

                <div className="space-y-4">
                  {mappedTimeline.map((t, idx) => {
                    const startPct = (t.start / totalDuration) * 100
                    const widthPct = (t.durationMs / totalDuration) * 100
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-300 font-bold">{t.stepName}</span>
                          <span className="text-slate-500">{t.durationMs}ms</span>
                        </div>
                        <div className="h-3 bg-slate-950 rounded-full relative overflow-hidden">
                          <div
                            className="absolute h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
                            style={{ left: `${startPct}%`, width: `${Math.max(widthPct, 2)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === "prompts" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                  {agentOutputs?.map((ao) => (
                    <button
                      key={ao.id}
                      onClick={() => setSelectedAgent(ao)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg text-[10px] font-bold block transition truncate",
                        selectedAgent?.id === ao.id 
                          ? "bg-purple-600/10 text-purple-400 border border-purple-500/20"
                          : "text-slate-500 hover:text-slate-350"
                      )}
                    >
                      {ao.agentName}
                    </button>
                  ))}
                  {(!agentOutputs || agentOutputs.length === 0) && (
                    <div className="text-[10px] text-slate-600 text-center py-4">No agent logs.</div>
                  )}
                </div>

                <div className="md:col-span-3 space-y-4">
                  {selectedAgent ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Prompt Spec</span>
                        <pre className="p-3 bg-slate-950 text-slate-300 rounded-lg font-mono text-[9px] overflow-auto max-h-40 whitespace-pre-wrap select-all">
                          {selectedAgent.prompt}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Response Payload</span>
                        <pre className="p-3 bg-slate-950 text-emerald-400/90 rounded-lg font-mono text-[9px] overflow-auto max-h-48 whitespace-pre-wrap">
                          {selectedAgent.response}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-650">Select an agent node to inspect traces.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "github" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Markdown Commentary</span>
                <pre className="p-4 bg-slate-950 text-slate-300 rounded-xl font-mono text-xs overflow-auto max-h-[400px] whitespace-pre-wrap select-all border border-slate-850">
                  {githubCommentPreview || "No preview generated."}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Semantic Search, Meta info) */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Award className="w-4 h-4 text-purple-400" />
              AI Verdict Profile
            </h3>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Decision status</span>
              <div className={`text-base font-black ${review.aiDecision === "APPROVED" ? "text-green-500" : "text-amber-500"}`}>
                {review.aiDecision}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Executive Summary</span>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "{review.summaryReport || "Review complete. All parallel agents processed without warnings."}"
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0a0e17]/80 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Retrieved Semantic Search Scope
            </h3>
            {review.ragContext ? (
              <pre className="p-3 bg-slate-950 text-[10px] text-slate-450 rounded-lg border border-slate-850 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed font-mono">
                {review.ragContext}
              </pre>
            ) : (
              <div className="text-center py-6 text-xs text-slate-650 border border-dashed border-slate-850 rounded-xl">No active Semantic Search contexts retrieved.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
