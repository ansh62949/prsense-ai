import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/layout/Layout"
import { LayoutPremium } from "./components/layout/LayoutPremium"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import LandingPagePremium from "./pages/LandingPagePremium"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"
import CommandCenter from "./pages/CommandCenter"
import RepositoryManagement from "./pages/RepositoryManagement"
import RepositoryPage from "./pages/RepositoryPage"
import PullRequestReviews from "./pages/PullRequestReviews"
import PullRequestWorkspace from "./pages/PullRequestWorkspace"
import AIAgentCenter from "./pages/AIAgentCenter"
import AskRepository from "./pages/AskRepository"
import ReviewReports from "./pages/ReviewReports"
import LearnerDashboard from "./pages/LearnerDashboard"
import RepositoryIntelligence from "./pages/RepositoryIntelligence"
import ReviewTimeline from "./pages/ReviewTimeline"
import Monitoring from "./pages/Monitoring"
import ReviewDetails from "./pages/ReviewDetails"
import ReviewPlayground from "./pages/ReviewPlayground"
import Settings from "./pages/Settings"
import BillingSettings from "./pages/BillingSettings"
import DeveloperPortal from "./pages/DeveloperPortal"
import InviteAccept from "./pages/InviteAccept"

const ProtectedRoute = ({ element }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  return isAuthenticated ? element : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPagePremium />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite-accept" element={<InviteAccept />} />
      <Route path="/dashboard" element={<ProtectedRoute element={<LayoutPremium><CommandCenter /></LayoutPremium>} />} />
      <Route path="/repositories" element={<ProtectedRoute element={<LayoutPremium><RepositoryManagement /></LayoutPremium>} />} />
      <Route path="/repositories/:repoId" element={<ProtectedRoute element={<LayoutPremium><RepositoryPage /></LayoutPremium>} />} />
      <Route path="/reviews" element={<ProtectedRoute element={<LayoutPremium><ReviewReports /></LayoutPremium>} />} />
      <Route path="/reviews/:reviewId" element={<ProtectedRoute element={<LayoutPremium><ReviewDetails /></LayoutPremium>} />} />
      <Route path="/pull-requests/:prId" element={<ProtectedRoute element={<LayoutPremium><PullRequestWorkspace /></LayoutPremium>} />} />
      <Route path="/playground" element={<ProtectedRoute element={<LayoutPremium><ReviewPlayground /></LayoutPremium>} />} />
      <Route path="/pipeline" element={<ProtectedRoute element={<LayoutPremium><AIAgentCenter /></LayoutPremium>} />} />
      <Route path="/ask" element={<ProtectedRoute element={<LayoutPremium><AskRepository /></LayoutPremium>} />} />
      <Route path="/intelligence" element={<ProtectedRoute element={<LayoutPremium><RepositoryIntelligence /></LayoutPremium>} />} />
      <Route path="/timeline" element={<ProtectedRoute element={<LayoutPremium><ReviewTimeline /></LayoutPremium>} />} />
      <Route path="/reports" element={<ProtectedRoute element={<LayoutPremium><ReviewReports /></LayoutPremium>} />} />
      <Route path="/learner" element={<ProtectedRoute element={<LayoutPremium><LearnerDashboard /></LayoutPremium>} />} />
      <Route path="/monitoring" element={<ProtectedRoute element={<LayoutPremium><Monitoring /></LayoutPremium>} />} />
      <Route path="/settings" element={<ProtectedRoute element={<LayoutPremium><Settings /></LayoutPremium>} />} />
      <Route path="/profile" element={<ProtectedRoute element={<LayoutPremium><Settings /></LayoutPremium>} />} />
      <Route path="/billing" element={<ProtectedRoute element={<LayoutPremium><BillingSettings /></LayoutPremium>} />} />
      <Route path="/developer" element={<ProtectedRoute element={<LayoutPremium><DeveloperPortal /></LayoutPremium>} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
