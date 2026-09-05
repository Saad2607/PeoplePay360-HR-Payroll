import api from './axios';

export const departmentApi = {
  getAll: async () => {
    const response = await api.get('/departments');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },
};
