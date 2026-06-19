import React, { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { CheckCircle, AlertTriangle, RefreshCw, LogIn } from "lucide-react"

export default function InviteAccept() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  
  const [status, setStatus] = useState("verifying") // "verifying", "ready", "success", "error"
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMsg("Invitation token is missing in the URL query parameters.")
      return
    }

    if (!isAuthenticated) {
      setStatus("error")
      setErrorMsg("You must be logged in to accept an invitation. Please log in first.")
      return
    }

    setStatus("ready")
  }, [token, isAuthenticated])

  const handleAccept = async () => {
    setStatus("verifying")
    try {
      const authToken = localStosemantic searche.getItem("authToken")
      const res = await fetch(`${window.API_BASE_URL}/api/organizations/invites/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          token: token,
          userId: 1 // Assume user ID 1 for default admin, or query from auth context if present
        })
      })

      if (res.ok) {
        setStatus("success")
        setTimeout(() => {
          navigate("/settings")
        }, 3000)
      } else {
        const err = await res.json()
        setStatus("error")
        setErrorMsg(err.message || "Failed to accept the invitation. It may have expired or already been accepted.")
      }
    } catch (e) {
      console.error(e)
      setStatus("error")
      setErrorMsg("An unexpected network error occurred while accepting the invitation.")
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-slate-200 flex flex-col justify-center items-center p-6 relative">
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#ff5a1f]/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#09090b]/80 border border-slate-900 rounded-3xl p-8 backdrop-blur-md space-y-6 shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="inline-flex rounded-full bg-[#ff5a1f]/10 p-4 border border-[#ff5a1f]/20 text-[#ff5a1f] mb-2">
            <CheckCircle className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Workspace Onboarding</h1>
          <p className="text-xs text-slate-500">PRSense Collaborative Review Environment</p>
        </div>

        {status === "verifying" && (
          <div className="flex flex-col items-center py-6 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#ff5a1f] animate-spin" />
            <p className="text-xs text-slate-400">Processing invitation details...</p>
          </div>
        )}

        {status === "ready" && (
          <div className="space-y-6 py-4">
            <p className="text-xs text-slate-400 text-center leading-normal">
              You have been invited to collaborate in an isolated workspace as a team member. Accepting this invitation will link your account permissions.
            </p>
            <button
              onClick={handleAccept}
              className="w-full py-3 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 text-white rounded-xl text-xs font-black transition cursor-pointer"
            >
              Accept Invitation & Join
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-6 text-center">
            <div className="text-xs text-emerald-450 font-bold">
              🎉 Invitation accepted successfully!
            </div>
            <p className="text-[10px] text-slate-550">
              Redirecting you to the settings dashboard in a few seconds...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 py-4">
            <div className="p-4 bg-rose-500/5 border border-rose-500/20 text-rose-450 rounded-2xl text-xs flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold">Access Denied:</span>
                <p className="mt-1 text-slate-400 leading-normal">{errorMsg}</p>
              </div>
            </div>
            
            {!isAuthenticated ? (
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-[#ff5a1f]" />
                Proceed to Sign In
              </button>
            ) : (
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Go to Command Center
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
