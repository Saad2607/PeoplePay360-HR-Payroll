import api from './axios';

export const scheduleApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/schedules', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/schedules', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  },

  assignEmployee: async (data) => {
    const response = await api.patch('/schedules/assign-employee', data);
    return response.data;
  },

  assignContract: async (data) => {
    const response = await api.patch('/schedules/assign-contract', data);
    return response.data;
  },
};
