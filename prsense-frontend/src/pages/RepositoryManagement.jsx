import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, CheckCircle2, XCircle, RefreshCw, Plus, X, Save } from "lucide-react"

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

export default function RepositoryManagement() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Modal Form State
  const [repoFullName, setRepoFullName] = useState("")
  const [repoLanguage, setRepoLanguage] = useState("JavaScript")

  // Settings State
  const [autoApprove, setAutoApprove] = useState(() => {
    return localStorage.getItem("prsense_auto_approve") !== "false"
  })
  const [maxRuntime, setMaxRuntime] = useState(() => {
    return parseInt(localStorage.getItem("prsense_max_runtime") || "120")
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState("")

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/repositories`)
      if (res.ok) {
        const data = await res.json()
        setRepos(data)
      }
    } catch (e) {
      console.error("Failed to load repositories", e)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectRepo = async (e) => {
    e.preventDefault()
    if (!repoFullName.trim()) return

    setSubmitting(true)
    const parts = repoFullName.split("/")
    const name = parts[parts.length - 1] || repoFullName

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/repositories/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: repoFullName.trim(),
          name: name,
          language: repoLanguage
        })
      })

      if (res.ok) {
        setRepoFullName("")
        setModalOpen(false)
        fetchRepositories()
      }
    } catch (e) {
      console.error("Failed to sync repository", e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveSettings = () => {
    setSavingSettings(true)
    setSettingsMessage("")
    
    localStorage.setItem("prsense_auto_approve", autoApprove.toString())
    localStorage.setItem("prsense_max_runtime", maxRuntime.toString())
    
    setTimeout(() => {
      setSavingSettings(false)
      setSettingsMessage("Settings saved successfully!")
      setTimeout(() => setSettingsMessage(""), 3000)
    }, 800)
  }

  const triggerManualSync = async (repo) => {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/repositories/${repo.id}/index`, {
        method: "POST"
      })
      if (res.ok) {
        fetchRepositories()
      }
    } catch (e) {
      console.error("Manual sync failed", e)
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 text-foreground bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repository Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Connect GitHub repositories and configure webhook integrations</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2 font-bold cursor-pointer">
          <Github className="w-4 h-4" />
          Connect GitHub App
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border shadow-xl">
          <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-border">
            <div>
              <CardTitle>Connected Repositories</CardTitle>
              <CardDescription>Manage your active GitHub integrations and webhook statuses</CardDescription>
            </div>
            <button 
              onClick={fetchRepositories} 
              className="p-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-muted-foreground transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {loading && repos.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center gap-2">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : repos.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <Github className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-bold">No repositories connected</h3>
                <Button onClick={() => setModalOpen(true)} variant="outline" className="gap-2 font-bold">
                  <Plus className="w-4 h-4" /> Link Repository
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Webhooks</TableHead>
                    <TableHead>Primary Language</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repos.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Github className="w-4 h-4 text-primary" />
                          {repo.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`uppercase text-[10px] font-extrabold ${
                          repo.indexingStatus === "INDEXED" 
                            ? "bg-green-500/10 border-green-500/20 text-green-500" 
                            : repo.indexingStatus === "INDEXING" 
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-500 animate-pulse" 
                              : repo.indexingStatus === "PENDING"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                : repo.indexingStatus === "FAILED"
                                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                                  : "bg-secondary text-muted-foreground border-border"
                        }`}>
                          {repo.indexingStatus || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {repo.webhookStatus === "healthy" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs font-semibold text-muted-foreground capitalize">{repo.webhookStatus || "inactive"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border text-xs font-semibold">
                          {repo.language || "JavaScript"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => triggerManualSync(repo)}
                          variant="ghost" 
                          size="icon" 
                          title="Trigger Repository Synchronization"
                          className="hover:text-primary cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Global Settings Panel */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle>Global Review Settings</CardTitle>
              <CardDescription>Configure default agent behaviors</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">Auto-approve trivial changes</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAutoApprove(prev => !prev)}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      autoApprove 
                        ? "bg-green-500/10 border-green-500/30 text-green-500"
                        : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    {autoApprove ? "Enabled" : "Disabled"}
                  </button>
                  <span className="text-xs text-muted-foreground">Skip reviews for simple text files.</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground">Max Agent Runtime (seconds)</label>
                <Input 
                  type="number" 
                  value={maxRuntime} 
                  onChange={(e) => setMaxRuntime(parseInt(e.target.value) || 30)}
                  className="bg-secondary border-border text-sm text-foreground focus:ring-primary focus:border-transparent font-medium" 
                />
                <span className="text-[10px] text-muted-foreground block">Timeout threshold for parallel LangGraph node checks.</span>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                {settingsMessage && (
                  <p className="text-xs font-bold text-green-500 text-center animate-pulse">{settingsMessage}</p>
                )}
                <Button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer"
                >
                  {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Global Configurations
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Connect GitHub App Dialog (Overlay Modal) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md bg-card border-border shadow-2xl relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5 text-primary" />
                Connect GitHub Repository
              </CardTitle>
              <CardDescription>
                Simulate a GitHub App installation hook by registering your project repository.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleConnectRepo}>
              <CardContent className="p-6 space-y-4">
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Repository Full Name</label>
                  <Input 
                    placeholder="e.g. developer/ecommerce-platform-demo" 
                    value={repoFullName}
                    onChange={(e) => setRepoFullName(e.target.value)}
                    required
                    className="bg-secondary border-border text-foreground focus:ring-primary font-medium"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Use format: <code className="bg-secondary px-1 py-0.5 rounded font-mono font-bold text-primary">owner/repository-name</code>
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Stack Language</label>
                  <select
                    value={repoLanguage}
                    onChange={(e) => setRepoLanguage(e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="JavaScript">JavaScript</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="Go">Go</option>
                  </select>
                </div>

              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-border bg-secondary/20">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setModalOpen(false)}
                  className="border-border font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !repoFullName.trim()}
                  className="font-bold cursor-pointer"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Install & Connect"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  )
}
