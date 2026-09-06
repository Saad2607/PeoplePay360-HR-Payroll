import api from './axios';

export const dashboardApi = {
  /**
   * Fetch consolidated real-time operational and payroll dashboard metrics
   * @param {Object} [params]
   * @param {string} [params.period] - Period filter ('all', 'current-month', 'last-month', 'last-3-months', 'year-to-date', 'YYYY-MM')
   * @param {string} [params.department] - Department ObjectId
   * @param {string} [params.employeeType] - Employee Type ('Full-Time', 'Part-Time', 'Contract', 'Intern')
   */
  getSummary: async (params = {}) => {
    const res = await api.get('/payroll/dashboard', { params });
    return res.data;
  },
};
