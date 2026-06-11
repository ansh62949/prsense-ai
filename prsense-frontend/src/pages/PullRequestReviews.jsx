import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GitPullRequest, GitMerge, AlertCircle, CheckCircle2, Clock } from "lucide-react"

const prs = [
  { id: 1, title: "Feature: Implement LangGraph agents", repo: "backend-api", author: "jdoe", status: "reviewing", findings: 3, critical: 1, time: "10 mins ago" },
  { id: 2, title: "Fix: Resolve race condition in webhook processor", repo: "core-ml", author: "msmith", status: "approved", findings: 0, critical: 0, time: "1 hr ago" },
  { id: 3, title: "Refactor: Migrate to React Server Components", repo: "frontend-web", author: "aturing", status: "rejected", findings: 12, critical: 4, time: "3 hrs ago" },
  { id: 4, title: "Chore: Update dependencies", repo: "backend-api", author: "dependabot", status: "approved", findings: 0, critical: 0, time: "5 hrs ago" },
  { id: 5, title: "Docs: Update API documentation", repo: "infrastructure", author: "jdoe", status: "approved", findings: 2, critical: 0, time: "1 day ago" },
]

export default function PullRequestReviews() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pull Request Reviews</h1>
          <p className="text-muted-foreground mt-1">Monitor active and historical PR reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="col-span-2 flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>All pull requests analyzed by PRSense AI</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="divide-y divide-border">
                {prs.map((pr) => (
                  <div key={pr.id} className="p-6 hover:bg-muted/50 transition-colors group cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <GitPullRequest className="w-5 h-5 text-primary" />
                          <span className="font-semibold text-lg group-hover:text-primary transition-colors">{pr.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-foreground">{pr.repo}</span>
                          </span>
                          <span>•</span>
                          <span>Opened by <span className="font-medium">{pr.author}</span></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {pr.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant="outline" 
                          className={
                            pr.status === "approved" ? "border-green-500/20 text-green-500 bg-green-500/10" : 
                            pr.status === "rejected" ? "border-red-500/20 text-red-500 bg-red-500/10" : 
                            "border-primary/20 text-primary bg-primary/10"
                          }
                        >
                          {pr.status === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {pr.status === "rejected" && <AlertCircle className="w-3 h-3 mr-1" />}
                          {pr.status === "reviewing" && <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />}
                          <span className="capitalize">{pr.status}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-muted-foreground">{pr.findings} Total Findings</span>
                      </div>
                      {pr.critical > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-red-500 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          {pr.critical} Critical Issues
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Review Summary</CardTitle>
            <CardDescription>Aggregate metrics for this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auto-approved</span>
                  <span className="font-medium text-green-500">45%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[45%]" />
                </div>
             </div>
             
             <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Changes Requested</span>
                  <span className="font-medium text-yellow-500">38%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[38%]" />
                </div>
             </div>

             <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Critical Vulnerabilities Blocked</span>
                  <span className="font-medium text-red-500">17%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[17%]" />
                </div>
             </div>

             <div className="pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <GitMerge className="w-8 h-8 text-primary p-1.5 bg-primary/10 rounded-md" />
                  <div>
                    <p className="text-sm font-medium">Avg Review Time</p>
                    <p className="text-2xl font-bold">1m 45s</p>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
