import { backendApi, aiApi } from "@/config/api";
import React, { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { 
  LayoutDashboard, 
  GitBranch, 
  GitPullRequestDraft, 
  Network, 
  Search, 
  FileText, 
  BrainCircuit,
  Bell,
  Clock,
  BookOpen,
  Database,
  Code,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

const Github = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const navigation = [
  { name: "AI Insights", href: "/dashboard", icon: LayoutDashboard },
  { name: "Repositories", href: "/repositories", icon: GitBranch },
  { name: "Repo Intelligence", href: "/intelligence", icon: BookOpen },
  { name: "Query Codebase", href: "/ask", icon: Search },
  { name: "PR Reviews", href: "/reviews", icon: GitPullRequestDraft },
  { name: "Review Playground", href: "/playground", icon: Code },
  { name: "Review Timeline", href: "/timeline", icon: Clock },
  { name: "Analysis Pipeline Center", href: "/pipeline", icon: Network },
  { name: "Learner Dashboard", href: "/learner", icon: BrainCircuit },
  { name: "System Monitoring", href: "/monitoring", icon: Database },
]

export function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [repos, setRepos] = useState([])
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })
  
  const [backendStatus, setBackendStatus] = useState("checking")
  const [aiStatus, setAiStatus] = useState("checking")

  useEffect(() => {
    fetchRepos()
    checkHealth()
    
    // Listen for local triggers to sync selector
    const syncSelector = () => {
      setSelectedRepoId(localStorage.getItem("prsense_selected_repo_id") || "")
    }
    window.addEventListener("repoChanged", syncSelector)
    return () => window.removeEventListener("repoChanged", syncSelector)
  }, [])

  const checkHealth = async () => {
    try {
      await backendApi.get("/api/health")
      setBackendStatus("connected")
    } catch (e) {
      setBackendStatus("disconnected")
    }

    try {
      await aiApi.get("/")
      setAiStatus("connected")
    } catch (e) {
      setAiStatus("disconnected")
    }
  }

  const fetchRepos = async () => {
    try {
      const res = await backendApi.get("/api/repositories")
      setRepos(res.data)
      if (res.data.length > 0 && !localStorage.getItem("prsense_selected_repo_id")) {
        localStorage.setItem("prsense_selected_repo_id", res.data[0].id.toString())
        setSelectedRepoId(res.data[0].id.toString())
        window.dispatchEvent(new Event("repoChanged"))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRepoChange = (e) => {
    const id = e.target.value
    localStorage.setItem("prsense_selected_repo_id", id)
    setSelectedRepoId(id)
    window.dispatchEvent(new Event("repoChanged"))
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const activeRepo = repos.find(r => r.id.toString() === selectedRepoId)
  const userInitials = user?.githubUsername?.substring(0, 2)?.toUpperCase() || user?.email?.substring(0, 2)?.toUpperCase() || "JD"

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Github className="w-6 h-6 mr-2 text-primary" />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">PRSense</span>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:translate-x-1 duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                  )}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t border-border bg-secondary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-extrabold text-xs shadow-md">
                {userInitials}
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-foreground">{user?.githubUsername || user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider">{user?.role || 'User'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-foreground"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center flex-1 gap-6">
            
            {/* Repository Select Dropdown */}
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg hidden sm:flex">
                <GitBranch className="w-4 h-4" />
              </div>
              <select
                value={selectedRepoId}
                onChange={handleRepoChange}
                className="bg-secondary border border-border text-foreground px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary w-52 truncate cursor-pointer shadow-sm transition-all"
              >
                <option value="">-- Select Active Repo --</option>
                {repos.map(r => (
                  <option key={r.id} value={r.id}>{r.fullName}</option>
                ))}
              </select>
            </div>

            {/* Quick search input */}
            <div className="relative w-72 hidden lg:block">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search PRs, logs, conventions..."
                className="block w-full pl-10 pr-3 py-2 text-xs border border-border rounded-xl bg-secondary/40 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {backendStatus === "connected" ? (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-green-500 bg-green-500/5 border border-green-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                <span>🟢 Backend Connected</span>
              </div>
            ) : backendStatus === "checking" ? (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
                <span>Checking Backend...</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-red-500 bg-red-500/5 border border-red-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                <span>🔴 Backend Offline</span>
              </div>
            )}

            {aiStatus === "connected" ? (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-green-500 bg-green-500/5 border border-green-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                <span>🟢 AI Service Connected</span>
              </div>
            ) : aiStatus === "checking" ? (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
                <span>Checking AI...</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-red-500 bg-red-500/5 border border-red-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                <span>🔴 AI Service Offline</span>
              </div>
            )}

            {activeRepo && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-secondary/40 border border-border px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Webhook Active
              </div>
            )}
            <button className="text-muted-foreground hover:text-foreground transition-all duration-200 relative p-2 bg-secondary/40 border border-border rounded-xl cursor-pointer">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 block h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-background" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/10 relative">
          {children}
        </div>
      </main>
    </div>
  )
}
