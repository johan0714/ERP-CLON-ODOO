import axios from 'axios';

// Normalizar la URL del backend tanto para local como para Render / Vercel
let rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}
if (!rawUrl.endsWith('/api')) {
  rawUrl = rawUrl.endsWith('/') ? `${rawUrl}api` : `${rawUrl}/api`;
}

const api = axios.create({
  baseURL: rawUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
