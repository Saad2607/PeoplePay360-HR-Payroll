const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/apiResponse');

// Health and API Status
router.get('/health', (req, res) => {
  return successResponse(
    res,
    {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'PeoplePay360 API'
    },
    'PeoplePay360 API is running smoothly'
  );
});

module.exports = router;
