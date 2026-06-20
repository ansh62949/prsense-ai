import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL, AI_BASE_URL, PROMETHEUS_URL, GRAFANA_URL } from './config/api';

window.API_BASE_URL = API_BASE_URL;
window.AI_BASE_URL = AI_BASE_URL;
window.PROMETHEUS_URL = PROMETHEUS_URL;
window.GRAFANA_URL = GRAFANA_URL;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
