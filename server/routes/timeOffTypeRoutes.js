const express = require('express');
const router = express.Router();
const timeOffTypeController = require('../controllers/timeOffTypeController');
const { authenticate, authorize } = require('../middleware/auth');
const { HR_MANAGERS } = require('../config/roles');
const validate = require('../middleware/validate');
const {
  createTimeOffTypeValidator,
  updateTimeOffTypeValidator
} = require('../validators/timeOffValidator');

// Authenticated routes
router.use(authenticate);

router.get('/', timeOffTypeController.getTimeOffTypes);
router.get('/:id', timeOffTypeController.getTimeOffTypeById);

// Admin & HR management routes
router.post(
  '/',
  authorize(...HR_MANAGERS),
  createTimeOffTypeValidator,
  validate,
  timeOffTypeController.createTimeOffType
);

router.put(
  '/:id',
  authorize(...HR_MANAGERS),
  updateTimeOffTypeValidator,
  validate,
  timeOffTypeController.updateTimeOffType
);

router.delete('/:id', authorize(...HR_MANAGERS), timeOffTypeController.deleteTimeOffType);

module.exports = router;
