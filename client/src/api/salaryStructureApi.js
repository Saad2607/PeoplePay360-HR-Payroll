import api from './axios';

export const salaryStructureApi = {
  getAll: async () => {
    const response = await api.get('/salary-structures');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/salary-structures/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/salary-structures', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/salary-structures/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/salary-structures/${id}`);
    return response.data;
  },
};
