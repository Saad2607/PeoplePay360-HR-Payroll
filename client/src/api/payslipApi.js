import api from './axios';

export const payslipApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/payslips', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/payslips/${id}`);
    return response.data;
  },

  downloadPdf: async (id) => {
    const response = await api.get(`/payslips/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
