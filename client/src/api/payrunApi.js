import api from './axios';

export const payrunApi = {
  getEligibleEmployees: async (data) => {
    const response = await api.post('/payruns/wizard/eligible-employees', data);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/payruns', data);
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/payruns', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/payruns/${id}`);
    return response.data;
  },

  compute: async (id) => {
    const response = await api.post(`/payruns/${id}/compute`);
    return response.data;
  },

  validate: async (id) => {
    const response = await api.post(`/payruns/${id}/validate`);
    return response.data;
  },

  checkValidation: async (id) => {
    const response = await api.get(`/payruns/${id}/validate`);
    return response.data;
  },

  markPaid: async (id, data = {}) => {
    const response = await api.post(`/payruns/${id}/mark-paid`, data);
    return response.data;
  },

  sendPayslips: async (id) => {
    const response = await api.post(`/payruns/${id}/send-payslips`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/payruns/${id}`);
    return response.data;
  },
};
