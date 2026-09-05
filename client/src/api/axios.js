import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
      return Promise.reject({
        status: 0,
        message: 'Cannot connect to backend server. Please make sure server is running on port 5000.',
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
