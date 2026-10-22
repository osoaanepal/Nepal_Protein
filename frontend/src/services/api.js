import axios from 'axios';

// Ensure baseURL always resolves with the '/api' prefix expected by the backend
const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || envUrl.trim() === '') {
    return '/api';
  }
  const cleanUrl = envUrl.trim().replace(/\/+$/, '');
  if (cleanUrl.endsWith('/api')) {
    return cleanUrl;
  }
  return `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true, // Send httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF defense: forces preflight on cross-origin requests
  },
});

// Purge any legacy localStorage token to ensure session is strictly managed by httpOnly cookies
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('osoaa_token');
  }
} catch {}

// Request interceptor: ensure credentials and security headers
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract response error message cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject({
      ...error,
      customMessage: message,
      code: error.response?.data?.code,
      email: error.response?.data?.email,
    });
  }
);

export default api;
