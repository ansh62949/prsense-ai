import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_CONFIG } from './config/api';

window.API_BASE_URL = API_CONFIG.BACKEND_URL;
window.AI_BASE_URL = API_CONFIG.AI_URL;
window.PROMETHEUS_URL = API_CONFIG.PROMETHEUS_URL;
window.GRAFANA_URL = API_CONFIG.GRAFANA_URL;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
