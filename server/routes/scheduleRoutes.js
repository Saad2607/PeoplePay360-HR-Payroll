const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', authorize('Admin', 'HR'), scheduleController.createSchedule);

module.exports = router;
