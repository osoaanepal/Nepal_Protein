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
  },
});

// Request interceptor: attach token from localStorage if available (fallback to cookies)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('osoaa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
