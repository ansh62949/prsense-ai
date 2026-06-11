import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
window.AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8000";
window.PROMETHEUS_URL = import.meta.env.VITE_PROMETHEUS_URL || "http://localhost:9090";
window.GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL || "http://localhost:3000";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
