import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { 
  Brain, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  BookOpen, 
  Cpu, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  Layers,
  FileCode,
  Sliders,
  Check,
  ChevronRight
} from "lucide-react"

const defaultLearningData = [
  { month: "Jan", patterns: 0, accuracy: 0 },
]

export default function LearnerDashboard() {
  const [activeRepo, setActiveRepo] = useState(null)
  const [patterns, setPatterns] = useState([])
  const [loadingPatterns, setLoadingPatterns] = useState(false)
  const [totalKBDocs, setTotalKBDocs] = useState(0)
  const [learningTrends, setLearningTrends] = useState([])
  const [dashboardData, setDashboardData] = useState(null)

  // Ingestion form state
  const [prTitle, setPrTitle] = useState("")
  const [prDiff, setPrDiff] = useState("")
  const [loadingLearn, setLoadingLearn] = useState(false)
  const [learnResult, setLearnResult] = useState(null)
  
  // Custom categories filter tab
  const [activeTab, setActiveTab] = useState("all")

  const API_BASE = `${window.AI_BASE_URL}`
  
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })

  useEffect(() => {
    if (selectedRepoId) {
      fetchRepositoryDetails(selectedRepoId)
    } else {
      setActiveRepo(null)
      setPatterns([])
    }

    const handleRepoChange = () => {
      const newRepoId = localStorage.getItem("prsense_selected_repo_id") || ""
      setSelectedRepoId(newRepoId)
      if (newRepoId) {
        fetchRepositoryDetails(newRepoId)
      } else {
        setActiveRepo(null)
        setPatterns([])
      }
    }

    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [selectedRepoId])

  // Triggered when activeRepo changes
  useEffect(() => {
    if (activeRepo) {
      fetchPatterns()
      fetchStats()
    }
  }, [activeRepo])

  const fetchRepositoryDetails = async (id) => {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/repositories/${id}`)
      if (res.ok) {
        const data = await res.json()
        setActiveRepo(data)
      }
    } catch (e) {
      console.error("Failed to fetch repository metadata", e)
    }
  }

  // Fetch Learned Patterns
  const fetchPatterns = async () => {
    setLoadingPatterns(true)
    try {
      const url = activeRepo 
        ? `${API_BASE}/api/learner/patterns?repo_name=${activeRepo.fullName}`
        : `${API_BASE}/api/learner/patterns`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPatterns(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch learned patterns:", error)
    } finally {
      setLoadingPatterns(false)
    }
  }

  // Fetch Knowledge Base Stats
  const fetchStats = async () => {
    try {
      const urlKb = activeRepo 
        ? `${API_BASE}/api/semantic search/knowledge-base-stats?repo_name=${activeRepo.fullName}`
        : `${API_BASE}/api/semantic search/knowledge-base-stats`
      const response = await fetch(urlKb)
      if (response.ok) {
        const data = await response.json()
        setTotalKBDocs(data.total_documents || 0)
      }
      
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Bearer ${token}` } : {}
      const url = activeRepo 
        ? `${window.API_BASE_URL}/api/analytics/dashboard?repoId=${activeRepo.id}`
        : `${window.API_BASE_URL}/api/analytics/dashboard`
      const dashRes = await fetch(url, { headers })
      if (dashRes.ok) {
        const dashData = await dashRes.json()
        setDashboardData(dashData)
        setLearningTrends(dashData.learningTrends || [])
      }
    } catch (error) {
      console.error("Failed to fetch KB stats & trends:", error)
    }
  }

  // Trigger Style Learning from PR
  const handleLearn = async (e) => {
    e.preventDefault()
    if (!prDiff.trim() || !activeRepo) {
      alert("Please ensure a repository is selected and diff is provided.")
      return
    }
    setLoadingLearn(true)
    setLearnResult(null)
    try {
      const payload = {
        pr_diff: prDiff,
        pr_title: prTitle.trim() ? prTitle : "Merged Pull Request",
        repo_name: activeRepo.fullName
      }
      const response = await fetch(`${API_BASE}/api/learner/learn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        setLearnResult({
          success: true,
          text: `Style analysis complete! Successfully extracted and stored ${data.patterns.length} coding preferences in your repository profile.`,
          items: data.patterns
        })
        setPrTitle("")
        setPrDiff("")
        // Refresh patterns and stats
        fetchPatterns()
        fetchStats()
      } else {
        const err = await response.json()
        setLearnResult({
          success: false,
          text: `Learning failed: ${err.detail || "Server error"}`
        })
      }
    } catch (error) {
      console.error("Learning failed:", error)
      setLearnResult({
        success: false,
        text: "Service unreachable. Verify FastAPI AI backend is running on port 8000."
      })
    } finally {
      setLoadingLearn(false)
    }
  }

  // Get filtered patterns by category tab selection
  const getFilteredPatterns = () => {
    if (activeTab === "all") return patterns
    return patterns.filter(p => {
      const cat = (p.category || "").toLowerCase()
      if (activeTab === "naming") return cat.includes("name") || cat.includes("naming")
      if (activeTab === "architecture") return cat.includes("arch") || cat.includes("architecture")
      if (activeTab === "conventions") return !cat.includes("name") && !cat.includes("arch")
      return true
    })
  }

  const filteredPatterns = getFilteredPatterns()

  return (
    <div className="p-6 space-y-6 text-foreground bg-[#0c0c0e] min-h-screen">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-[#ff5a1f]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-red-650/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-905 pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 rounded-xl">
              <Brain className="text-[#ff5a1f] w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Learner & conventions Engine</h1>
              <p className="text-slate-400 text-xs mt-0.5">
                AI custom preferences, codebase naming rules, and style guides dynamically extracted from historical commits.
              </p>
            </div>
          </div>
        </div>
        {activeRepo && (
          <div className="bg-[#09090b] border border-slate-900 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md">
            <span className="text-slate-450 font-bold">Scope:</span>
            <span className="text-[#ff5a1f] font-extrabold ml-1.5">{activeRepo.fullName}</span>
          </div>
        )}
      </div>

      {!activeRepo ? (
        <div className="h-[400px] border border-dashed border-slate-900 rounded-2xl flex flex-col justify-center items-center text-center p-8 space-y-4 bg-slate-950/20 backdrop-blur-md relative z-10">
          <div className="p-4 bg-slate-950 border border-slate-900 rounded-full inline-block">
            <AlertCircle className="w-10 h-10 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Active Repository Selected</h3>
            <p className="text-slate-450 text-sm max-w-sm">
              Please select a repository in the sidebar picker to view active learned code preferences.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          
          {/* KPI Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#09090b]/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                <span>Conventions Learned</span>
                <Brain className="w-4 h-4 text-[#ff5a1f]" />
              </div>
              <div className="text-2xl font-black text-white mt-1.5">{patterns.length} preferences</div>
            </div>
            <div className="bg-[#09090b]/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                <span>Baseline Accuracy</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-450 mt-1.5">
                {dashboardData?.averageConfidence 
                  ? (dashboardData.averageConfidence * 100).toFixed(1) + "%" 
                  : "85.0%"}
              </div>
            </div>
            <div className="bg-[#09090b]/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                <span>Semantic Search KB Chunks</span>
                <BookOpen className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1.5">{totalKBDocs} docs</div>
            </div>
            <div className="bg-[#09090b]/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                <span>Extraction pipeline</span>
                <Zap className="w-4 h-4 text-amber-400 font-black animate-pulse" />
              </div>
              <div className="text-2xl font-black text-white mt-1.5">AUTOMATIC</div>
            </div>
          </div>

          {/* Main Content Workspace Split */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left Content Column (8 cols): Ingest & Rules Database */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* Ingestion console */}
              <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#ff5a1f] animate-pulse" />
                    Feed AI Style Learner Agent
                  </h3>
                  <p className="text-slate-405 text-xs mt-1">
                    Paste a git diff or code file from a resolved feature merge. The Learner Agent will automatically extract style patterns, naming rules, and architectural expectations.
                  </p>
                </div>

                <form onSubmit={handleLearn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">PR Title / Short Note</label>
                    <input 
                      type="text"
                      placeholder="e.g. feat: Migrate all users database queries to async/await" 
                      value={prTitle}
                      onChange={(e) => setPrTitle(e.target.value)}
                      className="w-full bg-[#0c0c0e] border border-slate-900 text-xs rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5a1f]/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Merged PR Diff Code</label>
                    <textarea 
                      className="w-full min-h-36 font-mono text-xs bg-[#0c0c0e] border border-slate-900 rounded-lg p-3 text-slate-350 placeholder-slate-500 focus:outline-none focus:border-[#ff5a1f]/50 resize-y"
                      placeholder="Paste git diff here... e.g.
diff --git a/queries.js b/queries.js
- function getUser(id) { return db.find(id); }
+ async function getUser(id) { return await db.find(id); }"
                      value={prDiff}
                      onChange={(e) => setPrDiff(e.target.value)}
                      required
                    />
                  </div>

                  {learnResult && (
                    <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                      learnResult.success 
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" 
                        : "border-rose-500/20 bg-rose-500/5 text-rose-450"
                    }`}>
                      <div className="flex items-start gap-2.5">
                        {learnResult.success ? <CheckCircle2 className="w-4.5 h-4.5 shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 shrink-0" />}
                        <span className="font-semibold">{learnResult.text}</span>
                      </div>
                      {learnResult.success && learnResult.items && learnResult.items.length > 0 && (
                        <div className="pt-3 border-t border-slate-900 space-y-2.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Extracted Rules:</div>
                          <ul className="space-y-2 font-medium">
                            {learnResult.items.map((item, idx) => (
                              <li key={idx} className="flex gap-2 items-start text-slate-300">
                                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-[#ff5a1f] shrink-0" />
                                <div>
                                  <strong className="text-white font-bold">{item.title}</strong> 
                                  <span className="text-slate-500 text-[10px] font-mono ml-1.5 uppercase">[{item.category}]</span>
                                  <p className="text-slate-400 mt-0.5">{item.description}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button 
                      type="submit" 
                      disabled={loadingLearn} 
                      className="px-4 py-2.5 bg-[#ff5a1f] hover:bg-[#e04e1b] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingLearn ? "AI Ingestion Engine Running..." : "Extract & Store Coding Preferences"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Rules Database Container */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <Sliders className="w-4.5 h-4.5 text-[#ff5a1f]" />
                    Conventions Database ({filteredPatterns.length})
                  </h3>

                  {/* Filter tabs */}
                  <div className="flex bg-[#0c0c0e] border border-slate-900 p-1 rounded-xl w-full sm:w-auto">
                    {[
                      { id: "all", label: "All" },
                      { id: "naming", label: "Naming" },
                      { id: "architecture", label: "Arch" },
                      { id: "conventions", label: "Style" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 sm:flex-initial text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          activeTab === tab.id 
                            ? "bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f]" 
                            : "text-slate-450 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingPatterns ? (
                  <div className="text-center py-12 text-xs text-slate-500 bg-[#09090b]/10 border border-dashed border-slate-900 rounded-2xl">
                    Loading database patterns...
                  </div>
                ) : filteredPatterns.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 bg-[#09090b]/10 border border-dashed border-slate-900 rounded-2xl space-y-2">
                    <p className="font-medium text-slate-400">No conventions found in this filter.</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Feed the learner agent above with recent pull request changes to seed your conventions database.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPatterns.map((pref) => {
                      const isNaming = (pref.category || "").toLowerCase().includes("name");
                      const isArch = (pref.category || "").toLowerCase().includes("arch");
                      return (
                        <div 
                          key={pref.id} 
                          className="bg-[#09090b]/50 border border-slate-900 rounded-xl p-5 hover:border-[#ff5a1f]/30 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <h4 className="font-bold text-xs text-white">{pref.title}</h4>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold">
                                  {isNaming ? (
                                    <Tag className="w-3 h-3 text-[#ff5a1f]" />
                                  ) : isArch ? (
                                    <Layers className="w-3 h-3 text-cyan-400" />
                                  ) : (
                                    <FileCode className="w-3 h-3 text-amber-400" />
                                  )}
                                  <span className="uppercase tracking-wide">{pref.category || "style"}</span>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 font-mono">
                                {Math.round((pref.confidence || 0.85) * 100)}% Match
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 leading-normal font-medium">
                              {pref.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono font-semibold">
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-450" />
                              Active check
                            </span>
                            <span>ID: {pref.id}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Right Side telemetry & tutorials (4 cols) */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Recharts AI evolution graph */}
              <div className="bg-[#09090b]/60 border border-slate-900 p-5 rounded-2xl backdrop-blur-md">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#ff5a1f] animate-bounce" />
                    AI Evolution Pipeline
                  </h3>
                  <p className="text-slate-400 text-[10px] font-medium">Conventions learned vs review accuracy baseline</p>
                </div>

                <div className="h-[200px] p-2 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={learningTrends && learningTrends.length > 0 ? learningTrends : defaultLearningData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1b1b22" vertical={false} opacity={0.3} />
                      <XAxis dataKey={learningTrends && learningTrends.length > 0 ? "week" : "month"} stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0c0c0e', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" name="Rules Learned" dataKey={learningTrends && learningTrends.length > 0 ? "rules" : "patterns"} stroke="#ff5a1f" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Step-by-step pipeline explainer */}
              <div className="bg-[#09090b]/60 border border-slate-900 p-5 rounded-2xl backdrop-blur-md space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Adaptive Ingestion Flow</h3>
                  <p className="text-slate-450 text-[10px] mt-0.5">Understanding the Learner pipeline</p>
                </div>

                <div className="space-y-3.5 text-xs text-slate-400 font-medium">
                  <div className="flex gap-3 items-start">
                    <div className="bg-slate-950 border border-slate-900 p-1 rounded font-bold text-[10px] text-[#ff5a1f] shrink-0 w-5 h-5 flex items-center justify-center">1</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-[11px]">Auto commit Scan</h4>
                      <p className="leading-normal text-[11px]">As developers merge pull requests, team specific styling rules and naming abstractions are automatically parsed.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="bg-slate-950 border border-slate-900 p-1 rounded font-bold text-[10px] text-[#ff5a1f] shrink-0 w-5 h-5 flex items-center justify-center">2</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-[11px]">Vector database indexing</h4>
                      <p className="leading-normal text-[11px]">Rules are stored in pgvector knowledge embeddings referencing context metadata.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="bg-slate-950 border border-slate-900 p-1 rounded font-bold text-[10px] text-[#ff5a1f] shrink-0 w-5 h-5 flex items-center justify-center">3</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-[11px]">Semantic Search Context Matching</h4>
                      <p className="leading-normal text-[11px]">Future code reviews query Semantic Search vectors to check code using your actual team guidelines instead of generic defaults!</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  )
}
