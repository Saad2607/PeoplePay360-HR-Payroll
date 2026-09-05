import api from './axios';

export const timeOffTypeApi = {
  getAll: async () => {
    const response = await api.get('/timeoff-types');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/timeoff-types/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/timeoff-types', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/timeoff-types/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/timeoff-types/${id}`);
    return response.data;
  },
};
