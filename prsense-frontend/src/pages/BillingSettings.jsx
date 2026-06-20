import { API_BASE_URL } from "@/config/api";
import React, { useState, useEffect } from "react"
import { 
  CreditCard, 
  Check, 
  ArrowUpRight, 
  HelpCircle, 
  Activity, 
  Coins, 
  Lock,
  Zap,
  Star,
  Users
} from "lucide-react"

export default function BillingSettings() {
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
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
      fetchBillingData()
    }
  }, [selectedOrgId])

  const fetchBillingData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const [subRes, usageRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/billing/subscription/${selectedOrgId}`, { headers }),
        fetch(`${API_BASE_URL}/api/billing/usage/${selectedOrgId}`, { headers })
      ])
      if (subRes.ok && usageRes.ok) {
        const subData = await subRes.json()
        const usageData = await usageRes.json()
        setSubscription(subData)
        setUsage(usageData)
      }
    } catch (e) {
      console.error("Failed to load billing metrics", e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planName) => {
    setUpgrading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/billing/subscription/${selectedOrgId}/upgrade`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ plan: planName })
      })
      if (res.ok) {
        await fetchBillingData()
        alert(`Successfully upgraded subscription to ${planName}!`)
      }
    } catch (e) {
      console.error(e)
      alert("Failed to upgrade subscription plan.")
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex flex-col justify-center items-center space-y-4">
        <div className="w-10 h-10 border-4 border-t-[#ff5a1f] border-slate-900 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Loading SaaS billing profiles...</p>
      </div>
    )
  }

  const plans = [
    {
      name: "FREE",
      price: "$0",
      period: "forever",
      desc: "Perfect for exploring PRSense capabilities on public repositories.",
      features: [
        "Up to 5 pull request reviews / month",
        "100k maximum embedding tokens / month",
        "Single repo workspace mapping",
        "Base Workflow Engine parallel reviews",
        "Standard Analysis Engine fallback circuit breaker"
      ]
    },
    {
      name: "PRO",
      price: "$49",
      period: "month",
      desc: "For growing teams that need thorough, continuous reviews across private repos.",
      features: [
        "Up to 100 pull request reviews / month",
        "5M embedding tokens limit / month",
        "Up to 10 active repository integrations",
        "Enhanced semantic memory caches (Semantic Search)",
        "Slack & Microsoft Teams notifications",
        "Priority AI model failovers (Audit Core ⇄ Analysis Engine)"
      ],
      highlight: true
    },
    {
      name: "TEAM",
      price: "$199",
      period: "month",
      desc: "Enterprise capabilities designed for scaling engineering organizations.",
      features: [
        "10,000+ pull request reviews / month",
        "500M embedding tokens limit / month",
        "Unlimited repositories and workspaces",
        "Developer API Portal keys & rate-limiting control",
        "Custom Prompt Registry version management",
        "Dedicated Semantic Search document indexing pipelines",
        "24/7 Priority SLA support"
      ]
    }
  ]

  return (
    <div className="p-6 space-y-6 bg-[#0c0c0e] text-slate-150 min-h-screen relative">
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#ff5a1f]/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <CreditCard className="text-[#ff5a1f] w-6 h-6" />
            Billing & Resource Settings
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage organization subscriptions, monitor real-time review quotas, and control Analysis Core token expenditures.
          </p>
        </div>
      </div>

      {/* Subscription overview dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active plan overview card */}
        <div className="lg:col-span-1 bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Active Subscription</div>
            <div>
              <div className="text-3xl font-black text-white flex items-center gap-2.5">
                {usage?.plan || "FREE"}
                <span className="text-xs bg-[#ff5a1f]/10 text-[#ff5a1f] border border-[#ff5a1f]/20 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-450 mt-1">
                Period renews on: {new Date(subscription?.currentPeriodEnd || Date.now()).toLocaleDateString()}
              </p>
            </div>
            <div className="border-t border-slate-900 pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tenant Org ID:</span>
                <span className="font-bold text-white font-mono">{selectedOrgId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Subscription Status:</span>
                <span className="font-bold text-emerald-400 capitalize">{subscription?.status || "active"}</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-[10px] font-medium text-slate-500 leading-normal flex items-start gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#ff5a1f] shrink-0 mt-0.5" />
              <span>Features sync automatically with our Celery/Workflow Engine queue boundary checks.</span>
            </div>
          </div>
        </div>

        {/* Meters (Reviews + Tokens) */}
        <div className="lg:col-span-2 bg-[#09090b]/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Resource Allocation Consumption</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PR reviews limit meter */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#ff5a1f]" />
                  Pull Request Audits
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {usage?.totalReviews} / {usage?.maxReviews}
                </span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-3.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-650 to-[#ff5a1f] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${usage?.reviewsPercentage || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{usage?.reviewsPercentage.toFixed(1)}% consumed</span>
                <span>Limit resets monthly</span>
              </div>
            </div>

            {/* AI Tokens consumed meter */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  Embedding & AI Tokens
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {usage?.totalTokens ? (usage.totalTokens / 1000).toFixed(1) : 0}k / {usage?.maxTokens ? (usage.maxTokens / 1000000).toFixed(0) : 0}M
                </span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-3.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${usage?.tokensPercentage || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{usage?.tokensPercentage.toFixed(2)}% consumed</span>
                <span>Aggregated in pgvector</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Pricing Options Panel */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5 uppercase font-mono tracking-widest text-slate-400">
          <Star className="w-4 h-4 text-[#ff5a1f]" />
          Available Subscriptions & Pricing Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isActive = usage?.plan === p.name
            return (
              <div 
                key={p.name}
                className={`bg-[#09090b]/40 border rounded-2xl p-6 backdrop-blur-md transition-all flex flex-col justify-between relative ${
                  isActive 
                    ? "border-[#ff5a1f] shadow-lg shadow-orange-500/5" 
                    : p.highlight 
                      ? "border-slate-800 hover:border-slate-700 shadow-md shadow-indigo-500/5"
                      : "border-slate-900 hover:border-slate-800"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                )}
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white">{p.name} PLAN</h3>
                    <p className="text-[10px] text-slate-500 mt-1">{p.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{p.price}</span>
                    <span className="text-xs text-slate-500">/ {p.period}</span>
                  </div>

                  <div className="border-t border-slate-900 pt-4 space-y-2">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <Check className="w-3.5 h-3.5 text-[#ff5a1f] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  {isActive ? (
                    <button 
                      disabled 
                      className="w-full py-2.5 bg-slate-950 border border-slate-900 text-slate-400 rounded-xl text-xs font-black transition cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-500" />
                      Your Active Plan
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpgrade(p.name)}
                      disabled={upgrading}
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        p.highlight 
                          ? "bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 text-white" 
                          : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white"
                      }`}
                    >
                      Upgrade Plan
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
