const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  checkInValidator,
  checkOutValidator,
  manualCorrectionValidator,
  attendanceQueryValidator
} = require('../validators/attendanceValidator');

// All attendance routes require authentication
router.use(authenticate);

// Check-in and Check-out
router.post('/check-in', checkInValidator, validate, attendanceController.checkIn);
router.post('/check-out', checkOutValidator, validate, attendanceController.checkOut);

// Query attendance records (employees see own, HR/Admin see all with filters)
router.get('/', attendanceQueryValidator, validate, attendanceController.getAllAttendance);

// Missing check-out detection (HR/Admin)
router.get('/missing-checkout', authorize('Admin', 'HR'), attendanceController.getMissingCheckouts);

// Employee specific attendance history
router.get('/employee/:employeeId', attendanceController.getEmployeeAttendance);

// Single attendance record by ID
router.get('/:id', attendanceController.getAttendanceById);

// Manual attendance correction (Restricted to HR and Admin)
router.put('/:id', authorize('Admin', 'HR'), manualCorrectionValidator, validate, attendanceController.manualCorrection);

module.exports = router;
