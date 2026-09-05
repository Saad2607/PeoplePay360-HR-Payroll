import api from './axios';

export const positionApi = {
  getAll: async (departmentId = null) => {
    const params = departmentId ? { department: departmentId } : {};
    const response = await api.get('/job-positions', { params });
    return response.data;
  },
};
