const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/auth');
const { HR_MANAGERS, ADMIN_ONLY } = require('../config/roles');

router.use(authenticate);

// List all working schedules
router.get('/', scheduleController.getSchedules);

// Assign schedule to employee
router.patch('/assign-employee', authorize(...HR_MANAGERS), scheduleController.assignScheduleToEmployee);

// Assign schedule to contract
router.patch('/assign-contract', authorize(...HR_MANAGERS), scheduleController.assignScheduleToContract);

// Get schedule by ID
router.get('/:id', scheduleController.getScheduleById);

// Create schedule
router.post('/', authorize(...HR_MANAGERS), scheduleController.createSchedule);

// Update schedule
router.put('/:id', authorize(...HR_MANAGERS), scheduleController.updateSchedule);

// Delete schedule
router.delete('/:id', authorize(...ADMIN_ONLY), scheduleController.deleteSchedule);

module.exports = router;
