import { API_BASE_URL } from "@/config/api";
import React, { useState, useEffect } from "react"
import { 
  Cpu, 
  Layers, 
  Settings, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  FileText, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  GitBranch,
  Star,
  ChevronRight,
  ChevronDown,
  Folder,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Database,
  Server
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function RepositoryIntelligence() {
  const [activeRepo, setActiveRepo] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [readme, setReadme] = useState("")
  const [architecture, setArchitecture] = useState("")
  const [standards, setStandards] = useState("")
  const [msg, setMsg] = useState("")

  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    return localStorage.getItem("prsense_selected_repo_id") || ""
  })

  // Selected file from the dynamic workspace tree
  const [selectedFile, setSelectedFile] = useState("README.md")
  const [expandedFolders, setExpandedFolders] = useState({})
  const [centerTab, setCenterTab] = useState("architecture")

  // Real repository snapshot and files
  const [snapshot, setSnapshot] = useState(null)
  const [files, setFiles] = useState([])
  const [profileExists, setProfileExists] = useState(true)

  useEffect(() => {
    if (selectedRepoId) {
      loadRepositoryData(selectedRepoId)
    }

    const handleRepoChange = () => {
      const newRepoId = localStorage.getItem("prsense_selected_repo_id") || ""
      setSelectedRepoId(newRepoId)
      if (newRepoId) {
        loadRepositoryData(newRepoId)
      } else {
        setActiveRepo(null)
        setSummary(null)
        setSnapshot(null)
        setFiles([])
        setProfileExists(true)
      }
    }

    window.addEventListener("repoChanged", handleRepoChange)
    return () => window.removeEventListener("repoChanged", handleRepoChange)
  }, [selectedRepoId])

  const loadRepositoryData = async (id) => {
    setLoading(true)
    setProfileExists(true)
    try {
      const repoRes = await fetch(`${API_BASE_URL}/api/repositories/${id}`)
      if (repoRes.ok) {
        const repoData = await repoRes.json()
        setActiveRepo(repoData)
      }

      // Check snapshot
      const snapshotRes = await fetch(`${API_BASE_URL}/api/repositories/${id}/snapshot`)
      if (snapshotRes.status === 404) {
        setProfileExists(false)
        setSnapshot(null)
      } else if (snapshotRes.ok) {
        const snapshotData = await snapshotRes.json()
        setSnapshot(snapshotData)
        setProfileExists(true)
      } else {
        setProfileExists(false)
        setSnapshot(null)
      }

      // Fetch dynamic files
      const filesRes = await fetch(`${API_BASE_URL}/api/repositories/${id}/files`)
      if (filesRes.ok) {
        const filesData = await filesRes.json()
        setFiles(filesData)
      }

      const summaryRes = await fetch(`${API_BASE_URL}/api/repositories/${id}/summary`)
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData)
      }
    } catch (e) {
      console.error("Failed to load repository intelligence details", e)
      setProfileExists(false)
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerIndexing = async () => {
    if (!activeRepo) return
    setIndexing(true)
    setMsg("")
    try {
      const res = await fetch(`${API_BASE_URL}/api/repositories/${activeRepo.id}/index`, {
        method: "POST"
      })
      if (res.ok) {
        setMsg("Indexing task submitted to queue successfully! Please wait while the workers analyze the codebase...")
        setTimeout(() => {
          loadRepositoryData(activeRepo.id)
        }, 3000)
      } else {
        setMsg("Failed to submit indexing task.")
      }
    } catch (e) {
      setMsg("Failed to connect to backend.")
    } finally {
      setIndexing(false)
    }
  }

  const handleBuildIntelligence = async (e) => {
    e.preventDefault()
    if (!activeRepo) return

    setIndexing(true)
    setMsg("")
    try {
      const res = await fetch(`${API_BASE_URL}/api/repositories/${activeRepo.id}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readme,
          architecture,
          standards
        })
      })
      if (res.ok) {
        const data = await res.json()
        setMsg(data.message || "Repository profile custom rules successfully ingested!")
        loadRepositoryData(activeRepo.id)
        setReadme("")
        setArchitecture("")
        setStandards("")
      } else {
        setMsg("Failed to generate repository intelligence profiles.")
      }
    } catch (err) {
      setMsg("Connection failed to Spring Boot backend.")
    } finally {
      setIndexing(false)
    }
  }

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
  }

  // Build the dynamic workspace tree from indexed files
  const buildFileTree = (filesList) => {
    const root = { name: "root", type: "folder", children: {} }
    
    filesList.forEach(file => {
      let path = file.title
      // Strip repo prefix if present in pgvector docs
      if (activeRepo && path.startsWith(activeRepo.fullName + "/")) {
        path = path.substring(activeRepo.fullName.length + 1)
      }
      
      const parts = path.split("/")
      let current = root
      
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: isLast ? "file" : "folder",
            fullPath: parts.slice(0, index + 1).join("/"),
            children: {}
          }
        }
        current = current.children[part]
      })
    })
    
    return root
  }

  const renderTree = (node, depth = 0) => {
    const sortedChildren = Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
    
    return sortedChildren.map(child => {
      const isFolder = child.type === "folder"
      const isExpanded = expandedFolders[child.fullPath]
      
      if (isFolder) {
        return (
          <div key={child.fullPath} className="space-y-1">
            <button
              onClick={() => toggleFolder(child.fullPath)}
              className="w-full flex items-center gap-1.5 text-slate-400 hover:text-slate-200 py-1 px-1 text-left select-none"
              style={{ paddingLeft: `${depth * 8 + 4}px` }}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="font-semibold truncate text-[11px]">{child.name}</span>
            </button>
            {isExpanded && (
              <div className="border-l border-slate-800 ml-2.5">
                {renderTree(child, depth + 1)}
              </div>
            )}
          </div>
        )
      } else {
        return (
          <button
            key={child.fullPath}
            onClick={() => setSelectedFile(child.name)}
            className={cn(
              "w-full text-left py-1 truncate flex items-center gap-1.5 text-[11px] hover:bg-slate-900/50 rounded px-1",
              selectedFile === child.name ? "text-white font-bold bg-slate-800/80" : "text-slate-500 hover:text-slate-300"
            )}
            style={{ paddingLeft: `${depth * 8 + 16}px` }}
          >
            <FileCode className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{child.name}</span>
          </button>
        )
      }
    })
  }

  // Parse dependency graph
  let graphData = { nodes: [], edges: [] }
  try {
    if (snapshot?.dependencyGraph) {
      graphData = JSON.parse(snapshot.dependencyGraph)
    }
  } catch (e) {
    console.error("Failed to parse dependency graph", e)
  }

  const layers = {
    client: [],
    api: [],
    service: [],
    repository: [],
    infrastructure: []
  }

  if (graphData.nodes) {
    graphData.nodes.forEach(node => {
      if (node.type === "react") {
        layers.client.push(node)
      } else if (["spring_controller", "fastapi", "node", "socket"].includes(node.type)) {
        layers.api.push(node)
      } else if (node.type === "spring_service") {
        layers.service.push(node)
      } else if (node.type === "spring_repository") {
        layers.repository.push(node)
      } else if (["database", "queue"].includes(node.type)) {
        layers.infrastructure.push(node)
      } else {
        layers.api.push(node)
      }
    })
  }

  const getNodeColorClass = (type) => {
    switch (type) {
      case "react":
        return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-cyan-500/5"
      case "spring_controller":
      case "fastapi":
      case "node":
      case "socket":
        return "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-purple-500/5"
      case "spring_service":
        return "bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-teal-500/5"
      case "spring_repository":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/5"
      case "database":
      case "queue":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5"
      default:
        return "bg-slate-500/10 border-slate-500/30 text-slate-400"
    }
  }

  const getNodeIcon = (type) => {
    switch (type) {
      case "react":
        return <Cpu className="w-3.5 h-3.5 shrink-0" />
      case "spring_controller":
      case "fastapi":
      case "node":
        return <Server className="w-3.5 h-3.5 shrink-0" />
      case "spring_service":
        return <Layers className="w-3.5 h-3.5 shrink-0" />
      case "spring_repository":
        return <FileCode className="w-3.5 h-3.5 shrink-0" />
      case "database":
        return <Database className="w-3.5 h-3.5 shrink-0" />
      default:
        return <Cpu className="w-3.5 h-3.5 shrink-0" />
    }
  }

  // Dynamic technology stack
  const techStack = []
  if (snapshot?.frameworks) {
    snapshot.frameworks.split(",").map(f => f.trim()).forEach(f => {
      if (f && f !== "Generic") techStack.push(f)
    })
  }
  if (snapshot?.databaseUsed) {
    snapshot.databaseUsed.split(",").map(d => d.trim()).forEach(d => {
      if (d && d !== "None") techStack.push(d)
    })
  }
  if (snapshot?.primaryLanguage) {
    techStack.push(snapshot.primaryLanguage)
  }
  if (snapshot?.buildTool && snapshot.buildTool !== "N/A") {
    techStack.push(snapshot.buildTool)
  }
  const uniqueTechStack = [...new Set(techStack)]

  const fileTreeRoot = buildFileTree(files)

  // Health score configuration
  const healthScore = snapshot?.repositoryHealthScore ? Math.round(snapshot.repositoryHealthScore) : null
  const getHealthColor = (score) => {
    if (!score) return "text-slate-400"
    if (score >= 85) return "text-emerald-400"
    if (score >= 70) return "text-amber-400"
    return "text-rose-400"
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col -m-6 text-slate-100 bg-[#07090e]">
      {/* Sub Header */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-slate-800/80 bg-[#0a0e17]/80 shrink-0">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-purple-400" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">REPOSITORY INTELLIGENCE</h1>
            <p className="text-[10px] text-slate-500">Analyze application structure, boundaries, and codebase conventions.</p>
          </div>
        </div>
        {activeRepo && (
          <div className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg font-mono">
            active: <span className="text-purple-400 font-bold">{activeRepo.name}</span>
          </div>
        )}
      </div>

      {!activeRepo ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-600 animate-bounce" />
          <h3 className="text-sm font-bold text-slate-300">No Active Repository Selected</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Please select an active repository in the top header menu to display repository architecture, tech stack mapping, and rules.
          </p>
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col justify-center items-center space-y-4">
          <RefreshCw className="w-10 h-10 text-purple-500 animate-spin" />
          <p className="text-xs text-slate-500 font-bold tracking-widest uppercase animate-pulse">Compiling repository structure...</p>
        </div>
      ) : !profileExists ? (
        /* Fail Loudly screen if repository profile does not exist */
        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-5 max-w-md mx-auto">
          <ShieldAlert className="w-16 h-16 text-amber-500 animate-bounce" />
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Repository Profile Required</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This repository hasn't been indexed. To inspect architecture mapping, technical debt, and conventions, you must generate a profile snapshot.
            </p>
          </div>
          <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 text-left w-full space-y-1.5 text-[10px] text-slate-400 font-mono">
            <div>• Repository: <span className="text-purple-400 font-bold">{activeRepo.fullName}</span></div>
            <div>• Index Status: <span className="text-amber-400 font-bold">PROFILE_NOT_FOUND</span></div>
          </div>
          <button
            onClick={handleTriggerIndexing}
            disabled={indexing}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20"
          >
            {indexing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Index Repository & Build Profile</span>
          </button>
          {msg && <p className="text-[10px] text-purple-400 font-bold animate-pulse">{msg}</p>}
        </div>
      ) : (
        /* Real Dynamic Three Panel Layout */
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL: File/Dir Tree Explorer */}
          <div className="w-64 border-r border-slate-800/80 bg-[#090c13] flex flex-col overflow-y-auto p-4 shrink-0">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Workspace Tree</h3>
            
            <div className="space-y-1 text-xs">
              <button 
                onClick={() => setSelectedFile("README.md")}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-left",
                  selectedFile === "README.md" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">README.md</span>
              </button>

              {/* Dynamic folder structure */}
              <div className="space-y-1 mt-2">
                {renderTree(fileTreeRoot)}
              </div>
            </div>
          </div>

          {/* CENTER PANEL: Architecture, Dependency, Summary View */}
          <div className="flex-1 border-r border-slate-800/80 bg-[#07090e] flex flex-col min-w-0">
            {/* Center Tab bar */}
            <div className="flex border-b border-slate-800/80 bg-[#0a0e17]/50 px-4 pt-2 shrink-0">
              {[
                { id: "architecture", label: "Architecture View" },
                { id: "dependency", label: "Dependency Graph" },
                { id: "summary", label: "Repository Summary" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCenterTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-xs font-bold border-b-2 transition-colors",
                    centerTab === tab.id
                      ? "border-purple-500 text-white"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {centerTab === "architecture" && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Layered Topology Diagram
                  </h3>
                  
                  {/* Dynamic architecture SVG flow chart */}
                  <div className="border border-slate-800 bg-[#090d16]/70 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 min-h-[350px]">
                    {Object.keys(layers).every(k => layers[k].length === 0) ? (
                      <div className="text-slate-500 text-xs font-mono text-center">
                        No architecture layers mapped. Codebase contains generic structure.
                      </div>
                    ) : (
                      <div className="w-full max-w-lg space-y-4">
                        {/* Client Layer */}
                        {layers.client.length > 0 && (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">User Interface</span>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {layers.client.map(node => (
                                <div key={node.id} className={cn("px-4 py-2 border rounded-xl flex items-center gap-2 text-xs font-bold shadow-md", getNodeColorClass(node.type))}>
                                  {getNodeIcon(node.type)}
                                  <span>{node.label}</span>
                                </div>
                              ))}
                            </div>
                            <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-500/50 to-purple-500/50 mt-1" />
                          </div>
                        )}

                        {/* API Layer */}
                        {layers.api.length > 0 && (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">API & Routing Gateway</span>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {layers.api.map(node => (
                                <div key={node.id} className={cn("px-4 py-2 border rounded-xl flex items-center gap-2 text-xs font-bold shadow-md", getNodeColorClass(node.type))}>
                                  {getNodeIcon(node.type)}
                                  <span>{node.label}</span>
                                </div>
                              ))}
                            </div>
                            {layers.service.length > 0 && <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500/50 to-teal-500/50 mt-1" />}
                          </div>
                        )}

                        {/* Service Layer */}
                        {layers.service.length > 0 && (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Business Logic Services</span>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {layers.service.map(node => (
                                <div key={node.id} className={cn("px-4 py-2 border rounded-xl flex items-center gap-2 text-xs font-bold shadow-md", getNodeColorClass(node.type))}>
                                  {getNodeIcon(node.type)}
                                  <span>{node.label}</span>
                                </div>
                              ))}
                            </div>
                            {layers.repository.length > 0 && <div className="w-0.5 h-6 bg-gradient-to-b from-teal-500/50 to-amber-500/50 mt-1" />}
                          </div>
                        )}

                        {/* Repository Layer */}
                        {layers.repository.length > 0 && (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Data Access Layer</span>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {layers.repository.map(node => (
                                <div key={node.id} className={cn("px-4 py-2 border rounded-xl flex items-center gap-2 text-xs font-bold shadow-md", getNodeColorClass(node.type))}>
                                  {getNodeIcon(node.type)}
                                  <span>{node.label}</span>
                                </div>
                              ))}
                            </div>
                            {layers.infrastructure.length > 0 && <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/50 to-emerald-500/50 mt-1" />}
                          </div>
                        )}

                        {/* Infrastructure Layer */}
                        {layers.infrastructure.length > 0 && (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Infrastructure & Cache</span>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {layers.infrastructure.map(node => (
                                <div key={node.id} className={cn("px-4 py-2 border rounded-xl flex items-center gap-2 text-xs font-bold shadow-md", getNodeColorClass(node.type))}>
                                  {getNodeIcon(node.type)}
                                  <span>{node.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tech Stack Badges */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Detected Technologies</span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueTechStack.map((tech, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-350 rounded-lg text-xs font-semibold">
                          {tech}
                        </span>
                      ))}
                      {uniqueTechStack.length === 0 && (
                        <span className="text-slate-600 text-xs italic">No technology profile detected.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {centerTab === "dependency" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Interactive Dependency Graph</h3>
                  <div className="border border-slate-800 bg-[#090d16]/70 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="text-center space-y-3">
                      <Activity className="w-10 h-10 text-cyan-400 animate-pulse mx-auto" />
                      <p className="text-xs font-bold text-slate-300">Codebase Structural Bounds</p>
                      
                      <div className="text-left bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-400 space-y-2 max-w-sm">
                        <div className="text-purple-400 font-bold mb-1">Scanned Components Count:</div>
                        <div>• API Entry points: {snapshot?.controllersCount || 0}</div>
                        <div>• Service controllers: {snapshot?.servicesCount || 0}</div>
                        <div>• Data Repositories: {snapshot?.repositoriesCount || 0}</div>
                        <div>• Code Unit tests: {snapshot?.testCount || 0}</div>
                      </div>
                      
                      {graphData.edges && graphData.edges.length > 0 ? (
                        <div className="text-left border border-slate-800 p-4 rounded-xl max-w-sm">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-2 font-mono">Connection Flow Matrix</span>
                          <div className="space-y-1 text-[11px] text-slate-400">
                            {graphData.edges.map((edge, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span className="text-purple-400 font-semibold">{edge.from}</span>
                                <span className="text-[9px] text-slate-600 font-mono">({edge.label})</span>
                                <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                                <span className="text-emerald-400 font-semibold">{edge.to}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-400">Clean: 0 circular dependencies detected.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {centerTab === "summary" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">AI Codebase Analysis Summary</h3>
                  <div className="p-5 bg-[#090d16]/70 border border-slate-800 rounded-2xl text-xs text-slate-350 leading-relaxed space-y-4">
                    <p>{summary?.summary || "No architectural summary generated. Index the codebase to populate."}</p>
                    
                    {snapshot?.codingStandards && (
                      <div className="space-y-1 border-t border-slate-800/80 pt-3">
                        <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Coding standards:</span>
                        <p className="text-slate-400">{snapshot.codingStandards}</p>
                      </div>
                    )}
                    
                    {snapshot?.securityRules && (
                      <div className="space-y-1 border-t border-slate-800/80 pt-3">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block font-mono">Security rules:</span>
                        <p className="text-slate-400">{snapshot.securityRules}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: AI Insights, Health, Warnings */}
          <div className="w-80 border-l border-slate-800/80 bg-[#090c13] flex flex-col overflow-y-auto p-4 shrink-0 space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Repository Health</h3>
              <div className="bg-[#07090e] p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                <div>
                  <div className={cn("text-2xl font-black", getHealthColor(healthScore))}>
                    {healthScore ? `${healthScore}%` : "N/A"}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Quality Rating</div>
                </div>
                <div className={cn("w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center", healthScore >= 85 ? "text-emerald-400" : "text-amber-400")}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Architecture Violations & Scan Findings */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Architecture Violations & Risk
              </h3>
              <div className="space-y-2.5">
                {snapshot && (snapshot.securityRules?.includes("vulnerabilities") || snapshot.codingStandards?.includes("style issues")) ? (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-amber-400">Scan Findings</div>
                    {snapshot.securityRules && <p className="text-[10px] text-slate-400">• {snapshot.securityRules}</p>}
                    {snapshot.codingStandards && <p className="text-[10px] text-slate-400">• {snapshot.codingStandards}</p>}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-600 border border-dashed border-slate-850 rounded-xl">No active violations.</div>
                )}
              </div>
            </div>

            {/* Ingestion Console */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                Ingest New Rules
              </h3>
              <form onSubmit={handleBuildIntelligence} className="space-y-3">
                <textarea
                  value={readme}
                  onChange={(e) => setReadme(e.target.value)}
                  placeholder="Insert custom markdown standard..."
                  rows={4}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-lg p-2 text-[10px] text-slate-200 font-mono focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  type="submit"
                  disabled={indexing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 rounded-lg text-[10px] transition flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  {indexing ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Rebuild Profile"}
                </button>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
