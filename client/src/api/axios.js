import axios from 'axios';

// Resolve and normalize the API Base URL
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string' || !envUrl.trim()) {
    // If running in production browser on non-localhost, warn about missing VITE_API_URL
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn(
        '[PeoplePay360] VITE_API_URL is not set in environment variables! Falling back to localhost:5000/api.'
      );
    }
    return 'http://localhost:5000/api';
  }

  let cleaned = envUrl.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
};

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increased to 60 seconds to gracefully handle Render free-tier cold starts
  timeout: 60000,
});

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('peoplepay360_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract error envelopes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('peoplepay360_token');
        localStorage.removeItem('peoplepay360_user');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      const apiMessage = error.response.data?.message || 'An unexpected error occurred';
      const apiErrors = error.response.data?.errors || null;
      return Promise.reject({
        status: error.response.status,
        message: apiMessage,
        errors: apiErrors,
        raw: error,
      });
    } else if (error.request) {
      const isLocalhost = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
      let friendlyMessage;

      if (isLocalhost && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        friendlyMessage =
          'Frontend is attempting to connect to localhost:5000 in production. Please configure VITE_API_URL in your Vercel Project Settings to your Render backend URL and redeploy.';
      } else if (isLocalhost) {
        friendlyMessage =
          'Cannot connect to local backend server. Please make sure the server is running on port 5000.';
      } else {
        friendlyMessage =
          `Cannot connect to backend server at ${API_BASE_URL}. The backend service may be waking up from sleep (Render free tier cold start ~45s) or blocked by CORS. Please wait a few seconds and try again.`;
      }

      return Promise.reject({
        status: 0,
        message: friendlyMessage,
        raw: error,
      });
    }
    return Promise.reject({
      status: -1,
      message: error.message || 'Network error',
      raw: error,
    });
  }
);

export default api;
