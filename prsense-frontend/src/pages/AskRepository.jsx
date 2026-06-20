import { backendApi, aiApi } from "@/config/api";
import React, { useState, useEffect, useRef } from "react"
import { 
  Search, 
  Send, 
  HelpCircle, 
  BookOpen, 
  ChevronRight, 
  Database, 
  Compass, 
  Sparkles,
  RefreshCw,
  Award,
  CheckCircle,
  FileCode,
  AlertCircle,
  Pin,
  MessageSquare,
  GitBranch,
  ArrowRight,
  TrendingUp,
  Files
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AskRepository() {
  const [activeRepo, setActiveRepo] = useState(null)
  const [messages, setMessages] = useState([
    {
      sender: "copilot",
      text: "Hello! I am your PRSense Repository Copilot. I analyze READMEs, coding standards, architecture docs, and previous code review histories in pgvector. Ask me anything about the codebase conventions, design rules, or past pull request details!"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeCitations, setActiveCitations] = useState([])
  const [activeReasoning, setActiveReasoning] = useState("")
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })

  // Mocked state for left panel
  const [pinnedDocs, setPinnedDocs] = useState([
    { name: "README.md", type: "markdown" },
    { name: "ARCHITECTURE.md", type: "markdown" },
    { name: "CONTRIBUTING.md", type: "markdown" }
  ])
  const [conversations, setConversations] = useState([
    { id: 1, title: "Reviewing database credentials leak", active: true },
    { id: 2, title: "How is security configured?", active: false },
    { id: 3, title: "Check naming rules for Services", active: false }
  ])

  const bottomRef = useRef(null)

  useEffect(() => {
    if (selectedRepoId) {
      fetchRepositoryDetails(selectedRepoId)
    }

    const handleRepoChange = () => {
      const newRepoId = localStorage.getItem("prsense_selected_repo_id") || ""
      setSelectedRepoId(newRepoId)
      if (newRepoId) {
        fetchRepositoryDetails(newRepoId)
      } else {
        setActiveRepo(null)
      }
    }

    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [selectedRepoId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchRepositoryDetails = async (id) => {
    try {
      const res = await backendApi.get(`/api/repositories/${id}`)
      setActiveRepo(res.data)
    } catch (e) {
      console.error("Failed to fetch repository metadata", e)
    }
  }

  const handleSend = async (queryText) => {
    if (!queryText.trim() || !activeRepo) return

    const userQuery = queryText
    setInput("")
    setMessages(prev => [...prev, { sender: "user", text: userQuery }])
    setLoading(true)

    try {
      const res = await aiApi.post('/api/repository/ask', {
        repo_name: activeRepo.fullName,
        query: userQuery
      })
      const data = res.data
      const newMsg = {
        sender: "copilot",
        text: data.answer || "No response received.",
        reasoning: data.reasoning || "Retrieved semantic documents from vector store and generated response via Analysis Engine GPT-4o-mini.",
        citations: data.retrieved_documents || []
      }
      setMessages(prev => [...prev, newMsg])
      if (newMsg.citations && newMsg.citations.length > 0) {
        setActiveCitations(newMsg.citations)
      }
      if (newMsg.reasoning) {
        setActiveReasoning(newMsg.reasoning)
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { sender: "copilot", text: "Failed to compile response. The FastAPI service or database is offline." }])
    } finally {
      setLoading(false)
    }
  }

  const parseAnswerAndCitations = (text) => {
    if (!text) return { cleanedText: "", citations: [] }
    const citations = []
    const regex = /\[SOURCE:\s*([^\]|]+)\s*\|\s*TITLE:\s*([^\]]+)\]/g
    let match
    let cleanedText = text
    
    regex.lastIndex = 0
    while ((match = regex.exec(text)) !== null) {
      citations.push({
        type: match[1].trim(),
        title: match[2].trim()
      })
    }
    
    cleanedText = text.replace(regex, '').trim()
    return { cleanedText, citations }
  }

  const suggestedPrompts = [
    "What coding standards apply in this repository?",
    "Which architectural boundaries apply here?",
    "Show style conventions and naming guidelines"
  ]

  return (
    <div className="h-[calc(100vh-5rem)] flex -m-6 text-slate-100 bg-[#07090e] overflow-hidden">
      
      {/* LEFT PANEL: Context, Pins, History */}
      <div className="w-64 border-r border-slate-800/80 bg-[#090c13] flex flex-col p-4 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Branch/Context */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Context Scope</span>
            <div className="flex items-center gap-2 p-2 bg-[#07090e] border border-slate-850 rounded-lg text-xs font-semibold text-slate-300">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              <span>main (latest index)</span>
            </div>
          </div>

          {/* Pinned Documents */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pinned Context Docs</span>
            <div className="space-y-1">
              {pinnedDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-[#07090e]/50 hover:bg-[#07090e] border border-slate-850 rounded-lg text-xs cursor-pointer group transition">
                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-200">
                    <Pin className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversations History */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Recent Chats</span>
            <div className="space-y-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  className={cn(
                    "w-full text-left p-2 rounded-lg text-xs transition truncate block",
                    c.active 
                      ? "bg-purple-600/10 border border-purple-500/20 text-purple-300"
                      : "text-slate-500 hover:bg-slate-800/30 hover:text-slate-350"
                  )}
                >
                  💬 {c.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setMessages([{ sender: "copilot", text: "New conversation started. Ask me any codebase questions!" }])}
          className="w-full py-2 bg-slate-900 border border-slate-800 text-xs font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          + New Chat
        </button>
      </div>

      {/* CENTER PANEL: Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#07090e] relative justify-between">
        
        {/* Top bar */}
        <div className="h-14 border-b border-slate-800/80 bg-[#0a0e17]/50 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Repository Copilot</span>
          </div>
          {activeRepo && (
            <div className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono">
              {activeRepo.fullName}
            </div>
          )}
        </div>

        {!activeRepo ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-3">
            <AlertCircle className="w-12 h-12 text-slate-700 animate-bounce" />
            <h3 className="text-sm font-bold text-slate-300">Select a Repository</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Please choose a repository from the top selector menu to enable chat copilot context features.
            </p>
          </div>
        ) : (
          <>
            {/* Messages feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((m, idx) => {
                const { cleanedText, citations } = m.sender === "copilot" 
                  ? parseAnswerAndCitations(m.text) 
                  : { cleanedText: m.text, citations: [] }

                return (
                  <div key={idx} className={`flex gap-3.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {m.sender === "copilot" && (
                      <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-black shrink-0">
                        AI
                      </div>
                    )}
                    <div className="max-w-xl space-y-1.5">
                      <div className={cn(
                        "p-4 rounded-xl text-xs leading-relaxed border",
                        m.sender === "user"
                          ? "bg-purple-600 text-white border-purple-500 rounded-tr-none shadow-lg shadow-purple-500/10"
                          : "bg-[#0a0e17]/80 text-slate-300 border-slate-800/80 rounded-tl-none"
                      )}>
                        <p className="whitespace-pre-wrap font-medium">{cleanedText}</p>
                        
                        {/* Inline Citations */}
                        {citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Sources Cited:</span>
                            <div className="flex flex-wrap gap-1">
                              {citations.map((cite, cIdx) => (
                                <span key={cIdx} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                                  {cite.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className="flex gap-3.5 justify-start animate-pulse">
                  <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-black shrink-0">
                    AI
                  </div>
                  <div className="p-4 rounded-xl text-xs bg-[#0a0e17]/80 border border-slate-800/80 text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>Searching Semantic Search context indices...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Prompt helpers */}
            {messages.length === 1 && (
              <div className="p-6 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Compass className="w-3 h-3 text-purple-400" />
                  Quick Prompts
                </span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(p)}
                      className="bg-[#0a0e17] hover:bg-slate-800/80 text-slate-300 border border-slate-800 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="p-4 border-t border-slate-800 bg-[#0a0e17]/50 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend(input)
                }}
                className="flex gap-2.5 max-w-4xl mx-auto"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about the repository code or styling standards..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 rounded-xl transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* RIGHT PANEL: Semantic Search Sources, Reasoning, Scores */}
      <div className="w-80 border-l border-slate-800/80 bg-[#090c13] flex flex-col p-4 shrink-0 overflow-y-auto space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            AI Confidence Profile
          </h3>
          <div className="bg-[#07090e] p-4 rounded-xl border border-slate-850 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Response Confidence</span>
              <span className="font-extrabold text-emerald-400">92% Match</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: "92%" }} />
            </div>
          </div>
        </div>

        {activeReasoning && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Reasoning Steps
            </span>
            <p className="text-[11px] text-slate-400 bg-[#07090e] border border-slate-850 p-3 rounded-xl leading-relaxed italic">
              {activeReasoning}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Semantic Search Semantic Nodes
          </h3>
          {activeCitations.length > 0 ? (
            <div className="space-y-3">
              {activeCitations.map((doc, idx) => (
                <div key={idx} className="bg-[#07090e] border border-slate-850 p-3.5 rounded-xl space-y-2 hover:border-slate-700 transition">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="text-[11px] font-bold truncate text-slate-200">{doc.title}</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                      {Math.round(doc.score * 100)}%
                    </span>
                  </div>
                  <pre className="p-2 bg-slate-950 text-[10px] text-slate-450 rounded font-mono overflow-x-auto max-h-32 whitespace-pre-wrap leading-normal">
                    {doc.content}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-600 border border-dashed border-slate-850 rounded-xl">
              No active retrieval sources. Ask a question to load.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
