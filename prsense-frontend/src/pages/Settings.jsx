import { API_BASE_URL } from "@/config/api";
import React, { useState, useEffect } from "react"
import { 
  Building2, 
  Layers, 
  Users, 
  Plus, 
  Settings as SettingsIcon, 
  Check, 
  Mail, 
  Shield, 
  Globe, 
  AlertCircle,
  Copy,
  Trash2
} from "lucide-react"

export default function Settings() {
  const [activeTab, setActiveTab] = useState("organization")
  
  // Org States
  const [organizations, setOrganizations] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [newOrgName, setNewOrgName] = useState("")
  const [newOrgDesc, setNewOrgDesc] = useState("")
  
  // Workspace States
  const [workspaces, setWorkspaces] = useState([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("")
  const [newWsName, setNewWsName] = useState("")
  const [newWsDesc, setNewWsDesc] = useState("")
  const [newWsWebhook, setNewWsWebhook] = useState("")
  
  // Member & Invite States
  const [members, setMembers] = useState([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("REVIEWER")
  const [invites, setInvites] = useState([])
  const [inviteLink, setInviteLink] = useState("")
  
  // Feedback
  const [infoMessage, setInfoMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchWorkspaces(selectedOrgId)
    } else {
      setWorkspaces([])
      setSelectedWorkspaceId("")
    }
  }, [selectedOrgId])

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchMembers(selectedWorkspaceId)
    } else {
      setMembers([])
    }
  }, [selectedWorkspaceId])

  const showInfo = (msg) => {
    setInfoMessage(msg)
    setTimeout(() => setInfoMessage(""), 5000)
  }

  const showError = (msg) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(""), 5000)
  }

  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE_URL}/api/organizations`, { headers })
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data)
        if (data.length > 0) {
          const storedOrg = localStorage.getItem("prsense_selected_org_id")
          const exists = data.some(o => o.id.toString() === storedOrg)
          const activeOrgId = exists ? storedOrg : data[0].id.toString()
          setSelectedOrgId(activeOrgId)
          localStorage.setItem("prsense_selected_org_id", activeOrgId)
        }
      }
    } catch (e) {
      console.error(e)
      showError("Failed to fetch organizations")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async (e) => {
    e.preventDefault()
    if (!newOrgName.trim()) return
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/organizations`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newOrgName, description: newOrgDesc })
      })
      if (res.ok) {
        const newOrg = await res.json()
        showInfo(`Organization "${newOrg.name}" created successfully.`)
        setNewOrgName("")
        setNewOrgDesc("")
        await fetchOrganizations()
        setSelectedOrgId(newOrg.id.toString())
        localStorage.setItem("prsense_selected_org_id", newOrg.id.toString())
      }
    } catch (e) {
      console.error(e)
      showError("Failed to create organization")
    }
  }

  const handleOrgSwitch = (orgId) => {
    setSelectedOrgId(orgId)
    localStorage.setItem("prsense_selected_org_id", orgId)
    showInfo("Switched organization context.")
  }

  const fetchWorkspaces = async (orgId) => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE_URL}/api/organizations/${orgId}/workspaces`, { headers })
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data)
        if (data.length > 0) {
          const storedWs = localStorage.getItem("prsense_selected_workspace_id")
          const exists = data.some(w => w.id.toString() === storedWs)
          const activeWsId = exists ? storedWs : data[0].id.toString()
          setSelectedWorkspaceId(activeWsId)
          localStorage.setItem("prsense_selected_workspace_id", activeWsId)
        } else {
          setSelectedWorkspaceId("")
          localStorage.removeItem("prsense_selected_workspace_id")
        }
      }
    } catch (e) {
      console.error(e)
      showError("Failed to fetch workspaces")
    }
  }

  const handleCreateWorkspace = async (e) => {
    e.preventDefault()
    if (!newWsName.trim() || !selectedOrgId) return
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/organizations/${selectedOrgId}/workspaces`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          name: newWsName, 
          description: newWsDesc, 
          webhookUrl: newWsWebhook || `${API_BASE_URL}/api/webhooks/github` 
        })
      })
      if (res.ok) {
        const newWs = await res.json()
        showInfo(`Workspace "${newWs.name}" created successfully.`)
        setNewWsName("")
        setNewWsDesc("")
        setNewWsWebhook("")
        await fetchWorkspaces(selectedOrgId)
        setSelectedWorkspaceId(newWs.id.toString())
        localStorage.setItem("prsense_selected_workspace_id", newWs.id.toString())
      }
    } catch (e) {
      console.error(e)
      showError("Failed to create workspace")
    }
  }

  const handleWorkspaceSwitch = (wsId) => {
    setSelectedWorkspaceId(wsId)
    localStorage.setItem("prsense_selected_workspace_id", wsId)
    showInfo("Switched workspace context.")
    window.dispatchEvent(new Event("workspaceChanged"))
  }

  const fetchMembers = async (wsId) => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE_URL}/api/organizations/workspaces/${wsId}/members`, { headers })
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !selectedWorkspaceId) return
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/organizations/workspaces/${selectedWorkspaceId}/invites`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      })
      if (res.ok) {
        const invite = await res.json()
        showInfo(`Invitation generated for ${inviteEmail}`)
        const mockInviteLink = `${window.location.origin}/invite-accept?token=${invite.token}`
        setInviteLink(mockInviteLink)
        setInvites(prev => [invite, ...prev])
        setInviteEmail("")
      }
    } catch (e) {
      console.error(e)
      showError("Failed to send invite")
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    showInfo("Copied invitation link to clipboard!")
  }

  const activeOrg = organizations.find(o => o.id.toString() === selectedOrgId)
  const activeWs = workspaces.find(w => w.id.toString() === selectedWorkspaceId)

  return (
    <div className="p-6 space-y-6 bg-[#0c0c0e] text-slate-150 min-h-screen relative">
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#ff5a1f]/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="text-[#ff5a1f] w-6 h-6 animate-pulse" />
            Workspace & Tenant Settings
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage multi-tenant organizations, workspace repositories, and team permissions.
          </p>
        </div>
      </div>

      {/* Messages */}
      {infoMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Layout Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-[#09090b]/60 border border-slate-900 rounded-2xl p-3 space-y-1">
          <button
            onClick={() => setActiveTab("organization")}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
              activeTab === "organization" 
                ? "bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f]" 
                : "text-slate-400 hover:bg-slate-900/40 border border-transparent"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Organizations
          </button>
          <button
            onClick={() => setActiveTab("workspace")}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
              activeTab === "workspace" 
                ? "bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f]" 
                : "text-slate-400 hover:bg-slate-900/40 border border-transparent"
            }`}
          >
            <Layers className="w-4 h-4" />
            Workspaces
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
              activeTab === "members" 
                ? "bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f]" 
                : "text-slate-400 hover:bg-slate-900/40 border border-transparent"
            }`}
          >
            <Users className="w-4 h-4" />
            Team Members
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Tab 1: Organization Settings */}
          {activeTab === "organization" && (
            <div className="space-y-6">
              
              {/* Organization List & Switcher */}
              <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white">Select Active Organization</h3>
                  <p className="text-slate-450 text-[10px]">
                    Switch between business tenants. Repository lists and billing policies are isolated by organization.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizations.map(org => {
                    const isSelected = org.id.toString() === selectedOrgId
                    return (
                      <div 
                        key={org.id}
                        onClick={() => handleOrgSwitch(org.id.toString())}
                        className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? "bg-[#ff5a1f]/5 border-[#ff5a1f] text-white" 
                            : "bg-slate-950/40 border-slate-900 text-slate-350 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black">{org.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-1">{org.description || "No description provided."}</p>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#ff5a1f] flex items-center justify-center text-white shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 mt-4 uppercase">ID: {org.id}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Create Organization Form */}
              <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#ff5a1f]" />
                    Register New Organization
                  </h3>
                  <p className="text-slate-450 text-[10px]">
                    Create a clean isolated tenant workspace environment for another engineering division or team.
                  </p>
                </div>

                <form onSubmit={handleCreateOrganization} className="space-y-4 max-w-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Organization Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Initech Corp"
                      value={newOrgName}
                      onChange={e => setNewOrgName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ff5a1f] transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Description</label>
                    <textarea 
                      placeholder="Organization profile description..."
                      value={newOrgDesc}
                      onChange={e => setNewOrgDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ff5a1f] transition h-20"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 text-white rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    Create Organization
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* Tab 2: Workspaces Management */}
          {activeTab === "workspace" && (
            <div className="space-y-6">
              
              {/* Workspace List & Switcher */}
              <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white">
                    Workspaces in {activeOrg ? activeOrg.name : "Selected Organization"}
                  </h3>
                  <p className="text-slate-450 text-[10px]">
                    Workspaces let you segment integrations, Slack channels, and code review flows under specific projects.
                  </p>
                </div>

                {workspaces.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-900 text-center text-slate-550 rounded-2xl text-xs">
                    No workspaces found in this organization. Create one below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workspaces.map(ws => {
                      const isSelected = ws.id.toString() === selectedWorkspaceId
                      return (
                        <div 
                          key={ws.id}
                          onClick={() => handleWorkspaceSwitch(ws.id.toString())}
                          className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected 
                              ? "bg-[#ff5a1f]/5 border-[#ff5a1f] text-white" 
                              : "bg-slate-950/40 border-slate-900 text-slate-350 hover:border-slate-800"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-black">{ws.name}</h4>
                              <p className="text-[10px] text-slate-550 mt-1">{ws.description || "No description."}</p>
                              {ws.webhookUrl && (
                                <div className="mt-2 flex items-center gap-1 text-[9px] font-mono text-slate-500">
                                  <Globe className="w-3 h-3 text-[#ff5a1f]" />
                                  <span className="truncate max-w-[200px]" title={ws.webhookUrl}>{ws.webhookUrl}</span>
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-[#ff5a1f] flex items-center justify-center text-white shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 mt-4 uppercase">ID: {ws.id}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Create Workspace Form */}
              <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#ff5a1f]" />
                    Create New Workspace
                  </h3>
                  <p className="text-slate-450 text-[10px]">
                    Set up a new workspace with repository integrations and webhook callback paths.
                  </p>
                </div>

                <form onSubmit={handleCreateWorkspace} className="space-y-4 max-w-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Workspace Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Backend Services"
                      value={newWsName}
                      onChange={e => setNewWsName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ff5a1f] transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Description</label>
                    <textarea 
                      placeholder="Workspace purpose..."
                      value={newWsDesc}
                      onChange={e => setNewWsDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ff5a1f] transition h-16"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">GitHub App Webhook URL</label>
                    <input 
                      type="url"
                      placeholder={`${API_BASE_URL}/api/webhooks/github`}
                      value={newWsWebhook}
                      onChange={e => setNewWsWebhook(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ff5a1f] transition"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!selectedOrgId}
                    className="px-4 py-2 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 disabled:bg-slate-900 disabled:text-slate-500 text-white rounded-xl text-xs font-black transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Create Workspace
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* Tab 3: Team Members & Onboarding */}
          {activeTab === "members" && (
            <div className="space-y-6">
              
              {/* Workspace members list */}
              <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white">
                    Members in Workspace "{activeWs ? activeWs.name : "Selected Workspace"}"
                  </h3>
                  <p className="text-slate-405 text-[10px]">
                    Active developers and team leads assigned to this workspace context.
                  </p>
                </div>

                {!selectedWorkspaceId ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Please select or create a workspace first.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                          <th className="pb-3 pl-2">User Email</th>
                          <th className="pb-3">GitHub Username</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3 pr-2 text-right">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-950">
                        {members.map(member => (
                          <tr key={member.id} className="hover:bg-slate-900/30 transition text-slate-350">
                            <td className="py-3 pl-2 font-bold text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-[#ff5a1f]/20 text-[#ff5a1f] flex items-center justify-center font-bold text-[10px]">
                                {member.user.email.charAt(0).toUpperCase()}
                              </div>
                              {member.user.email}
                            </td>
                            <td className="py-3 font-mono text-slate-400">@{member.user.githubUsername}</td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                member.role === "OWNER" 
                                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                  : member.role === "ADMIN" 
                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}>
                                <Shield className="w-3 h-3" />
                                {member.role}
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-right text-slate-500">
                              {new Date(member.joinedAt || Date.now()).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Invitation Creation */}
              <div className="bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#ff5a1f]" />
                    Invite Workspace Member
                  </h3>
                  <p className="text-slate-450 text-[10px]">
                    Create onboarding keys to grant team members access to this workspace.
                  </p>
                </div>

                <form onSubmit={handleSendInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-2xl">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="developer@company.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ff5a1f] transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Workspace Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ff5a1f] cursor-pointer transition"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MAINTAINER">MAINTAINER</option>
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <button 
                      type="submit"
                      disabled={!selectedWorkspaceId}
                      className="px-4 py-2 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 disabled:bg-slate-900 disabled:text-slate-500 text-white rounded-xl text-xs font-black transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      Generate Invite Link
                    </button>
                  </div>
                </form>

                {inviteLink && (
                  <div className="mt-4 p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-2">
                    <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Onboarding Invite URL:</div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={inviteLink}
                        className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-lg outline-none font-mono text-[#ff5a1f] select-all"
                      />
                      <button 
                        onClick={() => copyToClipboard(inviteLink)}
                        className="p-1.5 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 rounded-lg text-white transition cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
