import api from './axios';

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('peoplepay360_token');
      localStorage.removeItem('peoplepay360_user');
    }
  },

  getUsers: async (params) => {
    const response = await api.get('/auth/users', { params });
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.patch(`/auth/users/${id}/role`, { role });
    return response.data;
  },

  toggleUserStatus: async (id, isActive) => {
    const response = await api.patch(`/auth/users/${id}/status`, { isActive });
    return response.data;
  },
};
