const express = require('express');
const router = express.Router();
const timeOffRequestController = require('../controllers/timeOffRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createTimeOffRequestValidator,
  refuseTimeOffRequestValidator,
  timeOffRequestQueryValidator
} = require('../validators/timeOffValidator');

// All time off request routes require authentication
router.use(authenticate);

// Submit leave request (Employee creates own, HR can create on behalf)
router.post('/', createTimeOffRequestValidator, validate, timeOffRequestController.createRequest);

// Query requests (Employee: own only; HR/Admin: all)
router.get('/', timeOffRequestQueryValidator, validate, timeOffRequestController.getAllRequests);

// Get requests for specific employee
router.get('/employee/:employeeId', timeOffRequestController.getEmployeeRequests);

// Get request by ID
router.get('/:id', timeOffRequestController.getRequestById);

// Approve request (Restricted to HR and Admin)
router.put('/:id/approve', authorize('Admin', 'HR'), timeOffRequestController.approveRequest);

// Refuse request (Restricted to HR and Admin)
router.put(
  '/:id/refuse',
  authorize('Admin', 'HR'),
  refuseTimeOffRequestValidator,
  validate,
  timeOffRequestController.refuseRequest
);

// Cancel request (Employee for own, HR for any)
router.put('/:id/cancel', timeOffRequestController.cancelRequest);

module.exports = router;
