const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { authenticate, authorize } = require('../middleware/auth');
const { HR_MANAGERS } = require('../config/roles');
const validate = require('../middleware/validate');
const {
  createAllocationValidator,
  updateAllocationValidator,
  allocationQueryValidator
} = require('../validators/timeOffValidator');

// Authenticated routes
router.use(authenticate);

// View allocations (Employee: own; HR/Admin: all)
router.get('/', allocationQueryValidator, validate, allocationController.getAllocations);

// View employee balance summary
router.get('/employee/:employeeId/balance', allocationController.getEmployeeLeaveBalance);

// Get single allocation
router.get('/:id', allocationController.getAllocationById);

// Admin & HR management
router.post(
  '/',
  authorize(...HR_MANAGERS),
  createAllocationValidator,
  validate,
  allocationController.createAllocation
);

router.put(
  '/:id',
  authorize(...HR_MANAGERS),
  updateAllocationValidator,
  validate,
  allocationController.updateAllocation
);

module.exports = router;
