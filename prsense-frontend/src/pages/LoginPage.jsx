import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// White-Rabbit custom logo component themed to brand orange
const PRSenseLogo = ({ className = "w-8 h-8" }) => (
  <div className={cn("rounded-full bg-[#ff5a1f] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0", className)}>
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
      <path d="M12 9c-2.8 0-5 2.2-5 5v3c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4v-3c0-2.8-2.2-5-5-5zm-2.5-7c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1zm5 0c-.6 0-1 .4-1 1v5.5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1z" />
    </svg>
  </div>
)

const Github = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    className={props.className}
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57V21.09c-3.33.72-4.035-1.605-4.035-1.605-.54-1.38-1.335-1.755-1.335-1.755-1.095-.75.09-.735.09-.735 1.215.09 1.86 1.245 1.86 1.245 1.08 1.83 2.82 1.305 3.51.99.105-.78.42-1.305.765-1.605-2.655-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22v3.3c0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("admin@prsense.ai")
  const [password, setPassword] = useState("password")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Dynamic background state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])

  // Setup mouse follow spotlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Generate particles/sparkles
  useEffect(() => {
    const items = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 4
    }))
    setParticles(items)
  }, [])

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError("Please enter your credentials.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Invalid credentials.")
        } else {
          throw new Error("Server error occurred.")
        }
      }

      const data = await response.json()
      login(data.token, { email: data.email, role: data.role, githubUsername: data.githubUsername })
      navigate("/dashboard")
    } catch (err) {
      console.error("Login failed:", err)
      setError("Connection to API backend failed. Make sure the Spring Boot server is running on ${window.API_BASE_URL}.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#ff5a1f]/30">
      
      {/* Background System Animations CSS Injector */}
      <style>{`
        @keyframes driftGrid {
          0% {
            background-position: 0px 0px;
          }
          100% {
            background-position: 3.5rem 3.5rem;
          }
        }
        .animate-drift-grid {
          animation: driftGrid 28s linear infinite;
        }
      `}</style>

      {/* Layer 1: Infinite animated grid background - CodeRabbit charcoal styled */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141416_1px,transparent_1px),linear-gradient(to_bottom,#141416_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] -z-10 pointer-events-none animate-drift-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_85%,transparent_100%)] opacity-40" />

      {/* Layer 2: Floating sparkles particles (Canvas style with Framer Motion) - CodeRabbit Orange */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-15">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-r from-[#ff5a1f] to-red-500"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -130, 0],
              x: [0, 30, 0],
              opacity: [0.15, 0.65, 0.15]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Layer 3: Rotating and floating soft orange-red radial blur orbs */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff5a1f]/5 rounded-full blur-[140px] -z-20 pointer-events-none"
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -40, 50, 0],
          scale: [1, 1.15, 0.9, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/5 rounded-full blur-[140px] -z-20 pointer-events-none"
        animate={{
          x: [0, -45, 30, 0],
          y: [0, 40, -40, 0],
          scale: [1, 0.95, 1.1, 1]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Layer 4: Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.012] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:12px_12px] -z-10 pointer-events-none" />

      {/* Layer 5: Mouse-follow spotlight gradient glow */}
      <div 
        className="absolute inset-0 -z-10 transition-opacity duration-300 pointer-events-none" 
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 90, 31, 0.09), transparent 85%)`
        }}
      />

      {/* Back to Home */}
      <button 
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK TO SITE
      </button>

      <div className="w-full max-w-md bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-2xl rounded-2xl p-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PRSenseLogo className="w-8 h-8" />
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase">
              PRSense <span className="text-[#ff5a1f] font-bold text-xs">AI</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Access Developer Console</h2>
          <p className="text-xs text-slate-500">Sign in to manage and analyze your repositories.</p>
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Work Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                required
                className="pl-9 pr-3 py-2 w-full bg-[#0c0c0e] border border-white/5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#ff5a1f] transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Password</label>
              <span className="text-[10px] text-[#ff5a1f] font-bold hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="pl-9 pr-3 py-2 w-full bg-[#0c0c0e] border border-white/5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#ff5a1f] transition"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-10 bg-gradient-to-r from-[#ff5a1f] to-[#e04e1b] hover:from-[#e04e1b] hover:to-[#c53d10] text-white rounded-xl text-xs font-bold shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 shadow-orange-500/10"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Sign In to Console"
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase font-black">
            <span className="px-3 bg-[#0c0c0e] text-slate-500 tracking-widest">Or connect with</span>
          </div>
        </div>

        <button 
          type="button" 
          onClick={() => handleLogin()}
          className="w-full h-10 border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-slate-350 rounded-xl text-xs flex items-center justify-center gap-2 font-bold cursor-pointer transition-all hover:border-[#ff5a1f]/30"
        >
          <Github className="w-3.5 h-3.5 text-slate-400" />
          Continue with GitHub Auth
        </button>

        {/* Demo login reminder helper */}
        <div className="text-[10px] text-slate-500 text-center bg-white/[0.01] p-2.5 rounded-xl border border-white/5 leading-normal">
          💡 Demo Mode active. Prefilled with <b>admin@prsense.ai</b> / <b>password</b>. Simply click "Sign In".
        </div>
      </div>
    </div>
  )
}
