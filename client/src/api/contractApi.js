import api from './axios';

export const contractApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/contracts', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/contracts/${id}`);
    return response.data;
  },

  getActiveByEmployee: async (employeeId) => {
    const response = await api.get(`/contracts/active/${employeeId}`);
    return response.data;
  },

  getByEmployee: async (employeeId) => {
    const response = await api.get(`/contracts/employee/${employeeId}`);
    return response.data;
  },

  getApplicableContract: async (employeeId, payrollPeriod) => {
    const response = await api.post('/contracts/applicable', {
      employeeId,
      payrollPeriod,
    });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/contracts', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/contracts/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/contracts/${id}`);
    return response.data;
  },
};
