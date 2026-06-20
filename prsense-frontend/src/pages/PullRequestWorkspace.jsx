import { API_BASE_URL } from "@/config/api";
import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  Code,
  Eye,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Folder,
  ArrowLeft,
  Settings,
  Sparkles,
  Award,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function PullRequestWorkspace() {
  const { prId } = useParams()
  const [pr, setPr] = useState(null)
  const [findings, setFindings] = useState([])
  const [selectedFile, setSelectedFile] = useState("src/main/java/com/app/service/UserService.java")
  const [loading, setLoading] = useState(true)

  // Simulation data when backend has no active data
  const mockFiles = [
    {
      name: "src/main/java/com/app/service/UserService.java",
      additions: 8,
      deletions: 1,
      diff: [
        { line: 14, type: "normal", content: "    public User findByEmail(String email) {" },
        { line: 15, type: "del", content: "-         String secretKey = \"AI_COPILOT_SECRET_X99\";" },
        { line: 15, type: "add", content: "+         // Loaded from environment configurations" },
        { line: 16, type: "add", content: "+         String secretKey = System.getenv(\"APP_SECRET_KEY\");" },
        { line: 17, type: "add", content: "+         if (email == null) {" },
        { line: 18, type: "add", content: "+             return null;" },
        { line: 19, type: "add", content: "+         }" },
        { line: 20, type: "normal", content: "         return userRepository.findByEmail(email);" },
        { line: 21, type: "normal", content: "    }" }
      ]
    },
    {
      name: "src/main/java/com/app/controller/OrderController.java",
      additions: 4,
      deletions: 2,
      diff: [
        { line: 8, type: "normal", content: "@RestController" },
        { line: 9, type: "del", content: "- private OrderRepository orderRepository;" },
        { line: 9, type: "add", content: "+ @Autowired" },
        { line: 10, type: "add", content: "+ private OrderService orderService;" }
      ]
    }
  ]

  const mockFindings = [
    {
      id: 101,
      agent: "Security Auditor",
      category: "security",
      severity: "critical",
      filePath: "src/main/java/com/app/service/UserService.java",
      lineNumber: 15,
      recommendation: "Remove hardcoded secret credentials key.",
      description: "Hardcoded credential 'AI_COPILOT_SECRET_X99' detected. Move secret keys to secure external vaults or load from environment.",
      whyFlagged: "Prevents source control credential leaks in public or private repositories.",
      ruleViolated: "OWASP-A02:2021-Cryptographic Failures",
      confidence: 0.99
    },
    {
      id: 102,
      agent: "Architecture Auditor",
      category: "architecture",
      severity: "high",
      filePath: "src/main/java/com/app/controller/OrderController.java",
      lineNumber: 9,
      recommendation: "Inject Service rather than direct Repository invocation.",
      description: "Controller communicates directly with DB model without passing through the transactional Service component.",
      whyFlagged: "Enforces separation of concerns and maintains business logic boundary layers.",
      ruleViolated: "Domain Architecture Guidelines (Section 4.1)",
      confidence: 0.94
    }
  ]

  useEffect(() => {
    fetchPRData()
  }, [prId])

  const fetchPRData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const selectedRepoId = localStorage.getItem("prsense_selected_repo_id")

      // Attempt to load PR from backend
      const prRes = await fetch(
        `${API_BASE_URL}/api/reviews/${prId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      if (prRes.ok) {
        const data = await prRes.json()
        setPr(data.pullRequest)
        setFindings(data.findings || [])
      } else {
        // Mock fallback if specific review is not found
        setPr({
          id: prId,
          title: "Refactor Authentication & Secrets",
          prNumber: 42,
          author: "octocat",
          status: "OPEN",
          createdAt: new Date().toISOString()
        })
        setFindings(mockFindings)
      }
    } catch (e) {
      console.error(e)
      setFindings(mockFindings)
    } finally {
      setLoading(false)
    }
  }

  const activeFileObj = mockFiles.find(f => f.name === selectedFile) || mockFiles[0]
  const activeFindings = findings.filter(f => f.filePath === selectedFile)

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col -m-6 text-slate-100 bg-[#07090e] overflow-hidden">
      {/* Header bar */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-slate-800/80 bg-[#0a0e17]/80 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/reviews" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-purple-500/10 border border-purple-500/25 text-purple-400 px-2 py-0.5 rounded">
                PR #{pr?.prNumber || prId}
              </span>
              <h1 className="text-xs font-bold text-slate-200">{pr?.title}</h1>
            </div>
            <p className="text-[9px] text-slate-500">Proposed by @{pr?.author || "author"} • status: <span className="text-purple-400 uppercase">{pr?.status}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
            Approve PR
          </button>
          <button className="px-3 py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer">
            Request Changes
          </button>
        </div>
      </div>

      {/* 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL 1: File List (Left) */}
        <div className="w-64 border-r border-slate-800/80 bg-[#090c13] flex flex-col p-4 shrink-0 overflow-y-auto">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Files Changed</span>
          <div className="space-y-1.5">
            {mockFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(file.name)}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg border transition text-xs flex justify-between items-center gap-2",
                  selectedFile === file.name
                    ? "bg-slate-800 border-slate-700 text-white font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850/40"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate font-mono">{file.name.split("/").pop()}</span>
                </div>
                <div className="flex gap-1 font-mono text-[9px] shrink-0">
                  <span className="text-emerald-400">+{file.additions}</span>
                  <span className="text-rose-400">-{file.deletions}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL 2: Diff Viewer (Center) */}
        <div className="flex-1 bg-[#07090e] flex flex-col min-w-0 overflow-y-auto">
          <div className="bg-[#0a0e17]/40 px-4 py-2 border-b border-slate-800/80 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-mono text-slate-400 truncate">{selectedFile}</span>
            <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">DIFF VIEW</span>
          </div>

          <div className="p-6 space-y-4 flex-1">
            <div className="border border-slate-800 rounded-xl bg-slate-950/80 overflow-hidden font-mono text-xs shadow-2xl">
              {activeFileObj.diff ? (
                <div className="divide-y divide-slate-900">
                  {activeFileObj.diff.map((line, idx) => (
                    <div key={idx} className="flex hover:bg-slate-900/30 transition-colors">
                      <span className="w-10 text-right pr-3 text-[10px] text-slate-650 select-none py-1 border-r border-slate-900 bg-slate-950/50">
                        {line.line || idx + 1}
                      </span>
                      <span className={cn(
                        "flex-1 pl-4 py-1 whitespace-pre overflow-x-auto",
                        line.type === "add" && "bg-green-950/25 text-green-400 border-l-2 border-green-500",
                        line.type === "del" && "bg-red-950/25 text-red-400 border-l-2 border-red-500",
                        line.type === "normal" && "text-slate-450"
                      )}>
                        {line.content}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No diff contents.</div>
              )}
            </div>

            {/* Inline Agent Comments */}
            {activeFindings.map((finding) => (
              <div key={finding.id} className="border border-purple-500/25 bg-gradient-to-r from-purple-950/10 to-[#0a0e17] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{finding.agent}</span>
                  </div>
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded font-black uppercase">
                    {finding.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-semibold">Line {finding.lineNumber}: {finding.recommendation}</p>
                <p className="text-xs text-slate-400 leading-normal">{finding.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 3: AI Findings Overview (Right) */}
        <div className="w-80 border-l border-slate-800/80 bg-[#090c13] flex flex-col p-4 shrink-0 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              Review Confidence
            </h3>
            <div className="bg-[#07090e] p-3.5 rounded-xl border border-slate-850 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Match Accuracy</span>
                <span className="font-extrabold text-emerald-400">96%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "96%" }} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Reference Guidelines
            </h3>

            {activeFindings.map((finding) => (
              <div key={finding.id} className="bg-[#07090e] border border-slate-850 p-4 rounded-xl space-y-2.5">
                <div>
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block">Rule Violated</span>
                  <span className="text-xs font-bold text-slate-200 mt-0.5 block">{finding.ruleViolated}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Audit Justification</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{finding.whyFlagged}</p>
                </div>
              </div>
            ))}
            
            {activeFindings.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-600 border border-dashed border-slate-850 rounded-xl">
                No active violations flagged for this file.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
