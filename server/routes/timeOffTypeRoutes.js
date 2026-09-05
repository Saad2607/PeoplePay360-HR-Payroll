const express = require('express');
const router = express.Router();
const timeOffTypeController = require('../controllers/timeOffTypeController');
const { authenticate, authorize } = require('../middleware/auth');
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
  authorize('Admin', 'HR'),
  createTimeOffTypeValidator,
  validate,
  timeOffTypeController.createTimeOffType
);

router.put(
  '/:id',
  authorize('Admin', 'HR'),
  updateTimeOffTypeValidator,
  validate,
  timeOffTypeController.updateTimeOffType
);

router.delete('/:id', authorize('Admin', 'HR'), timeOffTypeController.deleteTimeOffType);

module.exports = router;
