import api from './axios';

export const attendanceApi = {
  checkIn: async (data = {}) => {
    const response = await api.post('/attendance/check-in', data);
    return response.data;
  },

  checkOut: async (data = {}) => {
    const response = await api.post('/attendance/check-out', data);
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getMissingCheckouts: async () => {
    const response = await api.get('/attendance/missing-checkout');
    return response.data;
  },

  getByEmployee: async (employeeId) => {
    const response = await api.get(`/attendance/employee/${employeeId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  manualCorrection: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },
};
