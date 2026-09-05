import api from './axios';

export const salaryRuleApi = {
  getAll: async () => {
    const response = await api.get('/salary-rules');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/salary-rules/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/salary-rules', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/salary-rules/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/salary-rules/${id}`);
    return response.data;
  },
};
