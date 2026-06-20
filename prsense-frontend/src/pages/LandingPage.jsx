import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Terminal, 
  ShieldAlert, 
  Network, 
  BrainCircuit, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  GitPullRequest, 
  Lock, 
  Layers, 
  Database,
  Search,
  BookOpen
} from "lucide-react"

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

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("review")

  const services = [
    {
      title: "Static Code Analysis",
      description: "Automated syntax auditing, dead imports detection, and clean code heuristics checks directly on every commit.",
      icon: Terminal,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Security & Vulnerability Auditing",
      description: "Catches exposed API keys, SQL injection vulnerabilities, bypass controls, and risky npm/Maven package imports.",
      icon: ShieldAlert,
      color: "text-red-400 bg-red-500/10 border-red-500/20"
    },
    {
      title: "Architectural Guardrails",
      description: "Enforces your team's layering principles, ensuring controller boundaries, DB abstraction layers, and service calls remain untainted.",
      icon: Layers,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Naming & Style Standards",
      description: "Maintains consistent variable nomenclature, casing conventions, file directories layout, and inline code formatting.",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Auto-Rule Learner",
      description: "Learns organizational coding preferences dynamically from merged pull requests, populating vector stores automatically.",
      icon: BrainCircuit,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Semantic Search Guidelines Knowledgebase",
      description: "Feeds corporate policies, wikis, and Markdown documents into the Analysis Core context to ensure accurate, context-aware analysis.",
      icon: BookOpen,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    }
  ]

  const mockReviewComments = {
    review: [
      { agent: "Security Scanner", code: `- const STRIPE_KEY = "sk_test_51Nz...";`, comment: "🚨 Leak: Do not commit active credentials. Use environment configurations or vault storage.", type: "err" },
      { agent: "Architecture Reviewer", code: `- const users = await db.query("SELECT * FROM users");`, comment: "⚠️ Boundary Violation: Controllers should call UserService instead of executing direct queries.", type: "warn" }
    ],
    learner: [
      { rule: "Database Transaction Boundaries", context: "Learned from PR #142", details: "Extracted: Always annotate controller methods with @Transactional when modifying multiple tables." },
      { rule: "DTO Casing Conventions", context: "Learned from PR #148", details: "Extracted: Ensure request payloads inherit camelCase and response payloads inherit camelCase conventions." }
    ]
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans selection:bg-primary/30">
      
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-20 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-8 md:px-16 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
            <Github className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">PRSense</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Services</a>
          <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Interactive Demo</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</a>
          <Button onClick={() => navigate("/login")} className="font-bold rounded-xl shadow-lg shadow-primary/15 hover:shadow-primary/20 cursor-pointer">
            Launch Console
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-8 md:px-16 text-center space-y-8 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-black text-primary tracking-wide uppercase animate-pulse">
          <Cpu className="w-3.5 h-3.5" />
          Workflow Engine Parallel Code Analysis
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.15] bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
          Next-Gen AI Engineering Copilot <br />
          <span className="bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            For Automated Pull Request Reviews
          </span>
        </h1>

        <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-medium">
          PRSense evaluates code structures using four parallel agents (Static, Security, Architecture, Style) powered by Analysis Engine GPT-4o-mini and Celery task execution queues.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={() => navigate("/login")} className="h-12 px-8 font-black text-sm rounded-xl flex items-center gap-2 group shadow-xl shadow-primary/10 cursor-pointer">
            Enter Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "#demo"} className="h-12 px-8 border-border hover:bg-secondary/40 font-bold text-sm rounded-xl cursor-pointer">
            View Live Demo
          </Button>
        </div>
      </section>

      {/* Services Grid ("Services We Offer") */}
      <section id="services" className="py-20 px-8 md:px-16 border-t border-border bg-secondary/5 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Services & Specialized Agents</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto font-medium">
              We run concurrent analysis streams over every pull request to ensure high quality standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((svc, idx) => (
              <Card key={idx} className="border-border bg-card/45 backdrop-blur-md hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group duration-300">
                <CardHeader className="pb-3">
                  <div className={`p-3 rounded-xl border w-fit ${svc.color} group-hover:scale-110 transition-transform duration-300`}>
                    <svc.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-bold mt-4">{svc.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">{svc.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo section */}
      <section id="demo" className="py-20 px-8 md:px-16 border-t border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] text-primary uppercase font-black tracking-widest block">Interactive Sandbox</span>
              <h2 className="text-3xl font-black tracking-tight leading-tight">See it in Action</h2>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                Watch how PRSense hooks into pull requests. Toggle below to review simulated results or organizational learning conventions.
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab("review")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  activeTab === "review" 
                    ? "bg-primary/10 border-primary/20 text-primary" 
                    : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                Agent Code Comments
              </button>
              <button 
                onClick={() => setActiveTab("learner")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  activeTab === "learner" 
                    ? "bg-primary/10 border-primary/20 text-primary" 
                    : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                Learned Prefs
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-border bg-slate-950 rounded-2xl overflow-hidden shadow-2xl shadow-primary/5 font-mono text-xs">
              <div className="bg-slate-900 border-b border-border/80 px-4 py-3 flex items-center justify-between text-muted-foreground text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/40" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/40" />
                  <span className="w-3 h-3 rounded-full bg-green-500/40" />
                </div>
                <span>pr_review_preview.diff</span>
              </div>
              <div className="p-6 space-y-6 overflow-x-auto">
                {activeTab === "review" ? (
                  <div className="space-y-4">
                    {mockReviewComments.review.map((item, idx) => (
                      <div key={idx} className="space-y-2 border-l-2 border-primary/20 pl-3">
                        <div className="text-[10px] text-muted-foreground font-semibold">{item.agent}</div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-border/40 text-[11px] text-slate-300">
                          {item.code}
                        </div>
                        <div className={`text-[10px] font-bold ${item.type === "err" ? "text-red-400" : "text-amber-400"}`}>
                          {item.comment}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockReviewComments.learner.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                          <span>{item.rule}</span>
                          <span className="text-purple-400 font-bold">{item.context}</span>
                        </div>
                        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-border/20 leading-relaxed font-semibold">
                          {item.details}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-8 md:px-16 border-t border-border bg-secondary/5">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Simple, Developer-First Pricing</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto font-medium">
              Start securing and auditing your repositories with frictionless packages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Free Tier */}
            <Card className="border-border bg-card/60 backdrop-blur-md relative overflow-hidden flex flex-col">
              <CardHeader className="border-b border-border pb-5">
                <CardTitle className="text-lg font-bold">Community Tier</CardTitle>
                <CardDescription>Perfect for personal open-source projects</CardDescription>
                <div className="text-3xl font-black mt-4">$0</div>
              </CardHeader>
              <CardContent className="pt-6 flex-1 space-y-4 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  1 connected repository
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Basic Static Analysis reviews
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  15 reviews / month
                </div>
              </CardContent>
              <div className="p-6 border-t border-border">
                <Button onClick={() => navigate("/login")} variant="outline" className="w-full border-border font-bold rounded-xl cursor-pointer">
                  Get Started
                </Button>
              </div>
            </Card>

            {/* Pro Tier */}
            <Card className="border-primary/30 bg-card/75 backdrop-blur-md relative overflow-hidden flex flex-col shadow-xl shadow-primary/5">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] font-black tracking-wider uppercase px-3 py-1 rounded-bl-xl">
                MOST POPULAR
              </div>
              <CardHeader className="border-b border-border pb-5">
                <CardTitle className="text-lg font-bold">Pro Developer</CardTitle>
                <CardDescription>Complete multi-stage pipeline power</CardDescription>
                <div className="text-3xl font-black mt-4">$19 <span className="text-xs text-muted-foreground font-normal">/ developer / mo</span></div>
              </CardHeader>
              <CardContent className="pt-6 flex-1 space-y-4 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Unlimited connected repositories
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  All 4 Parallel Analysis Agents
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Auto-learning convention model
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Semantic Search custom rules context injections
                </div>
              </CardContent>
              <div className="p-6 border-t border-border">
                <Button onClick={() => navigate("/login")} className="w-full font-bold rounded-xl cursor-pointer">
                  Upgrade Console
                </Button>
              </div>
            </Card>

            {/* Enterprise Tier */}
            <Card className="border-border bg-card/60 backdrop-blur-md relative overflow-hidden flex flex-col">
              <CardHeader className="border-b border-border pb-5">
                <CardTitle className="text-lg font-bold">Enterprise</CardTitle>
                <CardDescription>Custom security configurations</CardDescription>
                <div className="text-2xl font-black mt-4">Custom Pricing</div>
              </CardHeader>
              <CardContent className="pt-6 flex-1 space-y-4 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Self-hosted / On-Premise deployments
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Dedicated support & SLAs
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Custom SSO / Identity Providers (Okta)
                </div>
              </CardContent>
              <div className="p-6 border-t border-border">
                <Button onClick={() => navigate("/login")} variant="outline" className="w-full border-border font-bold rounded-xl cursor-pointer">
                  Contact Sales
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-slate-950 py-12 text-center text-xs text-muted-foreground px-8">
        <p className="font-semibold">&copy; {new Date().getFullYear()} PRSense. Built for production-grade engineering teams.</p>
      </footer>

    </div>
  )
}
