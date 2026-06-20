import { API_BASE_URL, backendApi } from "@/config/api";
import React, { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  GitBranch,
  GitPullRequest,
  CheckSquare,
  BookOpen,
  Search,
  Clock,
  Cpu,
  Brain,
  Activity,
  Settings,
  User,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X,
  Radio,
  CreditCard,
  Key
} from "lucide-react"
import { cn } from "@/lib/utils"

// CodeRabbit Circular White-Rabbit Logo Custom component
const CodeRabbitLogo = ({ className = "w-8 h-8" }) => (
  <div className={cn("rounded-full bg-[#ff5a1f] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0", className)}>
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
      <path d="M12 9c-2.8 0-5 2.2-5 5v3c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4v-3c0-2.8-2.2-5-5-5zm-2.5-7c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1zm5 0c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1z" />
    </svg>
  </div>
)

const navigation = [
  { name: "Command Center", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { name: "Repositories", href: "/repositories", icon: GitBranch, group: "Overview" },
  { name: "Pull Requests", href: "/reviews", icon: GitPullRequest, group: "Core Workflows" },
  { name: "Reviews", href: "/playground", icon: CheckSquare, group: "Core Workflows" },
  { name: "Repository Intelligence", href: "/intelligence", icon: BookOpen, group: "Intelligence" },
  { name: "Query Codebase", href: "/ask", icon: Search, group: "Intelligence" },
  { name: "Execution Timeline", href: "/timeline", icon: Clock, group: "Observability" },
  { name: "Analysis Pipeline", href: "/pipeline", icon: Cpu, group: "Observability" },
  { name: "Rule Learner", href: "/learner", icon: Brain, group: "Engine" },
  { name: "Monitoring", href: "/monitoring", icon: Activity, group: "Observability" },
  { name: "Billing & Plans", href: "/billing", icon: CreditCard, group: "Enterprise" },
  { name: "Developer API", href: "/developer", icon: Key, group: "Enterprise" },
]

export function LayoutPremium({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [repos, setRepos] = useState([])
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Review completed for PR #42", unread: true, time: "5m ago" },
    { id: 2, text: "New pattern learned: naming convention in UserService", unread: false, time: "1h ago" },
    { id: 3, text: "Repository indexing completed", unread: false, time: "2h ago" },
  ])

  const [backendStatus, setBackendStatus] = useState("checking")
  const [aiStatus, setAiStatus] = useState("checking")

  useEffect(() => {
    fetchRepos()
    checkHealth()

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

  const selectedRepo = repos.find((r) => r.id.toString() === selectedRepoId)
  const groups = ["Overview", "Core Workflows", "Intelligence", "Engine", "Observability", "Enterprise"]

  return (
    <div className="flex h-screen bg-[#0c0c0e] text-slate-150 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 h-screen bg-[#09090b] border-r border-slate-900 transition-all duration-300 flex flex-col justify-between",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Section */}
          <div className="h-16 border-b border-slate-900 flex items-center justify-between px-4">
            <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center w-full")}>
              <CodeRabbitLogo className="w-8 h-8" />
              {sidebarOpen && (
                <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase">
                  PRSense <span className="text-[#ff5a1f] font-bold text-xs">AI</span>
                </span>
              )}
            </div>
          </div>

          {/* Repo Selector - Sidebar version (collapsed) */}
          {!sidebarOpen && (
            <div className="p-4 border-b border-slate-900 flex justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-[#ff5a1f]">
                {selectedRepo ? selectedRepo.name.substring(0, 2).toUpperCase() : "PR"}
              </div>
            </div>
          )}

          {/* Navigation Links Grouped */}
          <div className="flex-1 overflow-y-auto p-3 py-4 space-y-4 custom-scrollbar">
            {groups.map((group) => {
              const groupItems = navigation.filter((item) => item.group === group)
              if (groupItems.length === 0) return null

              return (
                <div key={group} className="space-y-1">
                  {sidebarOpen && (
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 block mb-1">
                      {group}
                    </span>
                  )}
                  {groupItems.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm group relative font-medium cursor-pointer",
                          isActive
                            ? "bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f] shadow-sm shadow-orange-500/5"
                            : "text-slate-450 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
                        )
                      }
                      title={!sidebarOpen ? item.name : ""}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0 group-hover:text-[#ff5a1f] transition-colors" />
                      {sidebarOpen && <span>{item.name}</span>}
                    </NavLink>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Profile/Settings */}
        <div className="p-3 border-t border-slate-900 bg-[#08080a] space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium cursor-pointer",
                isActive
                  ? "bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f]"
                  : "text-slate-450 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
              )
            }
            title={!sidebarOpen ? "Settings" : ""}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium cursor-pointer",
                isActive
                  ? "bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f]"
                  : "text-slate-450 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
              )
            }
            title={!sidebarOpen ? "Profile" : ""}
          >
            <User className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Profile</span>}
          </NavLink>

          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-450 hover:text-red-400 hover:bg-red-500/10 border border-transparent transition-all text-left text-sm font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#09090b] border-b border-slate-900 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Collapse Sidebar button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-900 hover:border-slate-800 bg-slate-950/50 hover:bg-slate-900 transition text-slate-400 hover:text-white cursor-pointer"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Repository Selector (Header Level) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest hidden md:inline">Project:</span>
              <div className="relative">
                <select
                  value={selectedRepoId}
                  onChange={handleRepoChange}
                  className="bg-[#0c0c0e] border border-slate-900 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-350 font-bold focus:outline-none focus:border-[#ff5a1f] appearance-none cursor-pointer hover:border-slate-800 transition"
                >
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.fullName}
                    </option>
                  ))}
                  {repos.length === 0 && <option value="">No Repositories</option>}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <div className="hidden lg:flex items-center gap-2 bg-[#0c0c0e] border border-slate-900 rounded-lg px-3 py-1.5 hover:border-slate-800 transition w-60">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search repository..."
                className="bg-transparent text-xs text-slate-200 placeholder-slate-550 outline-none w-full"
              />
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                ⌘K
              </span>
            </div>

            {/* Backend Connection Status */}
            {backendStatus === "connected" ? (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 font-bold tracking-wider uppercase text-[10px]">
                <span>🟢 Backend Connected</span>
              </div>
            ) : backendStatus === "checking" ? (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 font-bold tracking-wider uppercase text-[10px] animate-pulse">
                <span>Checking Backend...</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/5 border border-red-500/20 text-red-500 font-bold tracking-wider uppercase text-[10px]">
                <span>🔴 Backend Offline</span>
              </div>
            )}

            {/* AI Service Connection Status */}
            {aiStatus === "connected" ? (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 font-bold tracking-wider uppercase text-[10px]">
                <span>🟢 AI Service Connected</span>
              </div>
            ) : aiStatus === "checking" ? (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 font-bold tracking-wider uppercase text-[10px] animate-pulse">
                <span>Checking AI...</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/5 border border-red-500/20 text-red-500 font-bold tracking-wider uppercase text-[10px]">
                <span>🔴 AI Service Offline</span>
              </div>
            )}

            {/* Webhook Status */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Webhook Live</span>
            </div>

            {/* GitHub Connection Status */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/5 border border-[#ff5a1f]/20">
              <CodeRabbitLogo className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-[#ff5a1f] tracking-wider uppercase">App Connected</span>
            </div>

            {/* Notifications Center */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="w-8 h-8 rounded-lg border border-slate-900 hover:border-slate-800 bg-slate-950/50 hover:bg-slate-900 transition text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff5a1f] rounded-full animate-ping" />
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#09090b] border border-slate-900 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-905 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">Activity Stream</span>
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({...n, unread: false})))}
                      className="text-[10px] text-[#ff5a1f] hover:underline font-semibold cursor-pointer"
                    >
                      Clear unread
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "px-4 py-3 border-b border-slate-950 hover:bg-slate-900/30 transition text-xs flex justify-between items-start gap-2",
                          n.unread && "bg-orange-950/10"
                        )}
                      >
                        <p className="text-slate-350 font-medium">{n.text}</p>
                        <span className="text-[9px] text-slate-500 shrink-0">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg border border-slate-900 hover:border-slate-800 bg-slate-950/50 hover:bg-slate-900 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-[#ff5a1f] flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#09090b] border border-slate-900 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-900">
                    <p className="text-white text-xs font-bold">{user?.name || "Administrator"}</p>
                    <p className="text-slate-500 text-[10px] truncate">{user?.email || "admin@prsense.ai"}</p>
                  </div>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-slate-450 hover:text-white hover:bg-slate-900/40 transition text-xs font-semibold"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    System Settings
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border-t border-slate-900 mt-1 pt-2 transition-all text-xs font-semibold text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-auto bg-[#0c0c0e] p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 md:hidden z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
