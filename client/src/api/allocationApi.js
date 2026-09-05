import api from './axios';

export const allocationApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/allocations', { params });
    return response.data;
  },

  getEmployeeBalance: async (employeeId) => {
    const response = await api.get(`/allocations/employee/${employeeId}/balance`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/allocations/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/allocations', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/allocations/${id}`, data);
    return response.data;
  },
};
