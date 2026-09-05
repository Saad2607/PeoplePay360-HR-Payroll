import api from './axios';

export const timeOffRequestApi = {
  create: async (data) => {
    const response = await api.post('/timeoff-requests', data);
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/timeoff-requests', { params });
    return response.data;
  },

  getByEmployee: async (employeeId) => {
    const response = await api.get(`/timeoff-requests/employee/${employeeId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/timeoff-requests/${id}`);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.put(`/timeoff-requests/${id}/approve`);
    return response.data;
  },

  refuse: async (id, refusalReason = '') => {
    const response = await api.put(`/timeoff-requests/${id}/refuse`, { refusalReason });
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.put(`/timeoff-requests/${id}/cancel`);
    return response.data;
  },
};
