const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/apiResponse');

// Sub-route imports
const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const departmentRoutes = require('./departmentRoutes');
const jobPositionRoutes = require('./jobPositionRoutes');
const contractRoutes = require('./contractRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const timeOffTypeRoutes = require('./timeOffTypeRoutes');

// API Health Check
router.get('/health', (req, res) => {
  return successResponse(
    res,
    {
      status: 'UP',
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      service: 'PeoplePay360 HR & Payroll Core API',
      version: '1.0.0'
    },
    'PeoplePay360 API is healthy and running'
  );
});

// Mount Resource Routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/job-positions', jobPositionRoutes);
router.use('/contracts', contractRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/time-off-types', timeOffTypeRoutes);

module.exports = router;
