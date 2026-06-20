import axios from "axios";

export const API_CONFIG = {
  BACKEND_URL:
    import.meta.env.VITE_BACKEND_URL ||
    "https://prsense-ai-1.onrender.com",

  AI_URL:
    import.meta.env.VITE_AI_URL ||
    import.meta.env.VITE_AI_SERVICE_URL ||
    "https://prsense-ai.onrender.com",

  PROMETHEUS_URL:
    import.meta.env.VITE_PROMETHEUS_URL ||
    "http://localhost:9090",

  GRAFANA_URL:
    import.meta.env.VITE_GRAFANA_URL ||
    "http://localhost:3000",
};

export const backendApi = axios.create({
  baseURL: API_CONFIG.BACKEND_URL,
  withCredentials: true,
});

export const aiApi = axios.create({
  baseURL: API_CONFIG.AI_URL,
});

export const API_BASE_URL = API_CONFIG.BACKEND_URL;
export const AI_BASE_URL = API_CONFIG.AI_URL;

// Request interceptor to automatically add Authorization token to backendApi requests
backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Also add to aiApi if authentication header is ever required by FastAPI
aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
