import api from './axios';

export const scheduleApi = {
  getAll: async () => {
    const response = await api.get('/schedules');
    return response.data;
  },
};
