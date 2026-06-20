import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Cpu, 
  Coins, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  RefreshCw,
  Sparkles,
  Terminal,
  Activity
} from "lucide-react"

export default function ReviewPlayground() {
  const [snippet, setSnippet] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleRunReview = async () => {
    if (!snippet.trim()) {
      setError("Please paste some code to run the review.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/reviews/playground`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code_snippet: snippet, language: language })
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      } else {
        const errData = await res.json()
        setError(errData.error || "Failed to execute playground code review.")
      }
    } catch (e) {
      setError("Failed to connect to the backend gateway. Make sure both servers are running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-foreground bg-background">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
            <Code className="text-primary w-8 h-8" />
            Manual Review Playground
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Paste code snippets, select target language compilers, and run parallel multi-stage Analysis Core analysis manually.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: input text snippet */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3 flex flex-row justify-between items-center flex-wrap gap-3">
              <div>
                <CardTitle className="text-sm font-extrabold">Snippet Editor</CardTitle>
                <CardDescription className="text-xs">Input your target files or functions here.</CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-secondary border border-border text-foreground px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary w-32 cursor-pointer shadow-sm"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="typescript">TypeScript</option>
                  <option value="go">Go</option>
                  <option value="cpp">C++</option>
                </select>

                <button
                  onClick={handleRunReview}
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  Run Agent Review
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder="// Paste class definitions or unsafe code snippets here to run multi-stage checks...&#10;// e.g., hardcoded credentials, deeply nested logic, service bypasses, etc."
                className="w-full h-96 p-4 bg-slate-950 text-slate-100 rounded-xl border border-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none leading-relaxed"
              />
              {error && (
                <div className="mt-3 text-xs text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 font-medium">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: results metrics overview */}
        <div className="space-y-6">
          <Card className="border-border bg-card/60 backdrop-blur-md h-full">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" />
                Review Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {loading ? (
                <div className="h-64 flex flex-col justify-center items-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground text-xs font-medium animate-pulse">Running Workflow Engine nodes...</p>
                </div>
              ) : result ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-secondary/35 border border-border p-3 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-black">Tokens</span>
                      <div className="text-base font-black text-blue-400 flex items-center justify-center gap-0.5">
                        <Cpu className="w-3.5 h-3.5" />
                        {result.token_usage}
                      </div>
                    </div>
                    <div className="bg-secondary/35 border border-border p-3 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-black">Cost</span>
                      <div className="text-base font-black text-emerald-400 flex items-center justify-center gap-0.5">
                        <Coins className="w-3.5 h-3.5" />
                        ${result.cost.toFixed(5)}
                      </div>
                    </div>
                    <div className="bg-secondary/35 border border-border p-3 rounded-xl space-y-0.5 col-span-2">
                      <span className="text-[9px] text-muted-foreground uppercase font-black">Duration</span>
                      <div className="text-base font-black text-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {result.duration_ms} ms
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-black block">Decision Summary</span>
                    <p className="text-xs text-muted-foreground italic leading-normal">
                      "{result.summary || "No violations discovered in manual snippet check."}"
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-border pt-4">
                    <span className="text-[9px] text-muted-foreground uppercase font-black block">Findings: {result.findings?.length || 0}</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {result.findings?.map((f, idx) => (
                        <div key={idx} className="p-2.5 bg-secondary/25 border border-border rounded-lg text-[10px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-foreground">{f.agent}</span>
                            <Badge variant={f.severity === "critical" || f.severity === "high" ? "destructive" : "secondary"} className="uppercase text-[8px] px-1.5">
                              {f.severity}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-normal">{f.description}</p>
                          <div className="text-primary font-bold">Fix: {f.recommendation}</div>
                        </div>
                      ))}
                      {(!result.findings || result.findings.length === 0) && (
                        <div className="text-xs text-muted-foreground text-center py-4">No violations found!</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col justify-center items-center text-center p-4 text-muted-foreground space-y-2">
                  <Terminal className="w-10 h-10 text-muted-foreground animate-bounce" />
                  <h4 className="font-bold text-xs">Waiting for snippet review</h4>
                  <p className="text-[10px] max-w-[180px]">Paste code on the left editor and hit Run to evaluate code quality metrics.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
