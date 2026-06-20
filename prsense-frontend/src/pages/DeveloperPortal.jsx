import { API_BASE_URL } from "@/config/api";
import React, { useState, useEffect } from "react"
import { 
  Key, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  Terminal, 
  Activity, 
  Code, 
  ExternalLink,
  Lock,
  Eye,
  EyeOff
} from "lucide-react"

export default function DeveloperPortal() {
  const [keys, setKeys] = useState([])
  const [newKeyName, setNewKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState(null)
  const [showKeyToken, setShowKeyToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState("curl")
  
  const [selectedOrgId, setSelectedOrgId] = useState(() => {
    return localStorage.getItem("prsense_selected_org_id") || "1"
  })

  useEffect(() => {
    const syncSelector = () => {
      setSelectedOrgId(localStorage.getItem("prsense_selected_org_id") || "1")
    }
    window.addEventListener("orgChanged", syncSelector)
    return () => window.removeEventListener("orgChanged", syncSelector)
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchApiKeys()
    }
  }, [selectedOrgId])

  const fetchApiKeys = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/developer/keys/${selectedOrgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setKeys(data)
      }
      
      // Mock some developer logs
      setLogs([
        { id: 1, method: "POST", path: "/api/reviews", status: 200, ip: "192.168.1.42", time: "2m ago" },
        { id: 2, method: "POST", path: "/api/semantic search/ingest", status: 201, ip: "192.168.1.42", time: "15m ago" },
        { id: 3, method: "GET", path: "/api/repositories", status: 200, ip: "192.168.1.42", time: "1h ago" },
        { id: 4, method: "POST", path: "/api/reviews", status: 429, ip: "192.168.1.10", time: "3h ago" }
      ])
    } catch (e) {
      console.error("Failed to load developer portal keys", e)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateKey = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/developer/keys/${selectedOrgId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newKeyName })
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedKey(data.token)
        setNewKeyName("")
        await fetchApiKeys()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRevokeKey = async (id) => {
    if (!confirm("Are you sure you want to revoke this API token? It will stop working immediately.")) return
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/developer/keys/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        await fetchApiKeys()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const codeSnippets = {
    curl: `curl -X POST "${API_BASE_URL}/api/reviews" \\
  -H "Authorization: Bearer ${generatedKey || "prsense_live_..."}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repositoryId": 42,
    "commitSha": "9e1c258d4474",
    "pullRequestId": 7
  }'`,
    python: `import requests

url = "${API_BASE_URL}/api/reviews"
headers = {
    "Authorization": "Bearer ${generatedKey || "prsense_live_..."}",
    "Content-Type": "application/json"
}
payload = {
    "repositoryId": 42,
    "commitSha": "9e1c258d4474",
    "pullRequestId": 7
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,
    javascript: `fetch("${API_BASE_URL}/api/reviews", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${generatedKey || "prsense_live_..."}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    repositoryId: 42,
    commitSha: "9e1c258d4474",
    pullRequestId: 7
  })
})
.then(res => res.json())
.then(data => console.log(data));`
  }

  return (
    <div className="p-6 space-y-6 bg-[#0c0c0e] text-slate-150 min-h-screen relative">
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#ff5a1f]/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Key className="text-[#ff5a1f] w-6 h-6" />
            Developer API Portal
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Generate programmatic keys, configure webhooks, and integrate PRSense automated reviews into your CI/CD lines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Keys Management & Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* API Keys list card */}
          <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4 backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white">Active REST Access Keys</h3>
              <p className="text-slate-450 text-[10px]">
                API tokens grant full access to trigger PR audits, ingest Semantic Search knowledge, and fetch code reviews.
              </p>
            </div>

            {loading ? (
              <div className="py-4 text-center text-slate-500 text-xs">Loading keys...</div>
            ) : keys.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-900 text-center text-slate-550 rounded-xl text-xs">
                No active API keys found. Generate one below.
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map(k => (
                  <div key={k.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        {k.name}
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                          k.active 
                            ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" 
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          {k.active ? "ACTIVE" : "REVOKED"}
                        </span>
                      </div>
                      <div className="font-mono text-slate-500 text-[10px]">
                        {k.token.substring(0, 15)}...
                      </div>
                      <div className="text-[9px] text-slate-600">
                        Expires: {new Date(k.expiresAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>

                    {k.active && (
                      <button 
                        onClick={() => handleRevokeKey(k.id)}
                        className="p-1.5 hover:bg-red-500/10 text-slate-450 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg transition-all cursor-pointer"
                        title="Revoke Token"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Generator Card */}
          <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4 backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#ff5a1f]" />
                Generate Developer Token
              </h3>
              <p className="text-slate-450 text-[10px]">
                Create a new programmatic secret. Store it securely; you will not be able to retrieve it after closing this view.
              </p>
            </div>

            <form onSubmit={handleGenerateKey} className="flex gap-3 max-w-md">
              <input 
                type="text"
                required
                placeholder="e.g. Jenkins CI/CD Key"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ff5a1f] transition"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 text-white rounded-xl text-xs font-black transition cursor-pointer shrink-0"
              >
                Generate Key
              </button>
            </form>

            {generatedKey && (
              <div className="p-4 bg-slate-950 border border-[#ff5a1f]/20 rounded-xl space-y-2">
                <div className="text-[10px] font-mono uppercase text-[#ff5a1f] font-bold">Generated Private Secret:</div>
                <div className="flex items-center gap-2">
                  <input 
                    type={showKeyToken ? "text" : "password"}
                    readOnly 
                    value={generatedKey}
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-lg outline-none font-mono text-[#ff5a1f] select-all"
                  />
                  <button 
                    onClick={() => setShowKeyToken(!showKeyToken)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition cursor-pointer"
                  >
                    {showKeyToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => copyToClipboard(generatedKey)}
                    className="p-1.5 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 rounded-lg text-white transition cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[9px] text-yellow-500 font-semibold leading-normal">
                  ⚠️ Make sure to copy this token. We do not store plain-text secrets and it will never be displayed again.
                </p>
              </div>
            )}
          </div>

          {/* Request logs card */}
          <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4 backdrop-blur-md">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white">API Request Activity Stream</h3>
                <p className="text-slate-450 text-[10px]">
                  Real-time monitoring of client calls routed through Developer Api Keys.
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="p-3 bg-slate-950 border border-slate-905 rounded-xl flex items-center justify-between font-mono text-[10px]">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] ${
                      log.method === "POST" ? "bg-indigo-950 text-indigo-400 border border-indigo-900" : "bg-emerald-950 text-emerald-400 border border-emerald-900"
                    }`}>
                      {log.method}
                    </span>
                    <span className="text-slate-300">{log.path}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600">{log.ip}</span>
                    <span className={log.status >= 300 ? "text-rose-450" : "text-emerald-400"}>{log.status}</span>
                    <span className="text-slate-600 text-[9px] font-sans">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Code Playgrounds & Rate Limits (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Rate limits card */}
          <div className="bg-[#09090b]/60 border border-slate-900 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#ff5a1f]" />
                API Rate Limits
              </h3>
              <p className="text-slate-450 text-[10px]">
                Enforced client query quotas to protect Semantic Search indexing caches and Analysis Core context resources.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Standard Client API Rate</span>
                  <span className="font-bold text-[#ff5a1f] font-mono">60 req / min</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-[#ff5a1f] h-full w-2/3" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Semantic Search File Ingestion Ingest Rate</span>
                  <span className="font-bold text-[#ff5a1f] font-mono">10 uploads / min</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-[#ff5a1f] h-full w-1/4" />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Code snippets */}
          <div className="bg-[#09090b]/60 border border-slate-900 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Code className="w-4 h-4 text-emerald-500" />
                Integration Code Snippets
              </h3>
              <p className="text-slate-450 text-[10px]">
                Trigger automatic pull request audits from GitHub Action workflows or custom scripts.
              </p>
            </div>

            {/* Snippet selector tabs */}
            <div className="flex gap-2 border-b border-slate-900 pb-2">
              {["curl", "python", "javascript"].map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition ${
                    selectedLanguage === lang 
                      ? "bg-[#ff5a1f]/15 text-[#ff5a1f]" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="relative">
              <pre className="bg-slate-950 border border-slate-900 p-4 rounded-xl text-[10px] font-mono text-emerald-450 overflow-x-auto whitespace-pre leading-relaxed select-all">
                {codeSnippets[selectedLanguage]}
              </pre>
              <button 
                onClick={() => copyToClipboard(codeSnippets[selectedLanguage])}
                className="absolute top-2 right-2 p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg hover:text-white transition cursor-pointer"
                title="Copy snippet"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-900">
              <a 
                href={`${API_BASE_URL}/swagger-ui/index.html`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#ff5a1f] font-bold hover:underline"
              >
                Open Interactive Swagger API Specs
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
