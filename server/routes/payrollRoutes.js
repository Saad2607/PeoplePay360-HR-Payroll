const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { calculatePayslipValidator } = require('../validators/payrollValidator');

// All payroll routes require authentication
router.use(authenticate);

// Compute payslip breakdown (HR and Admin)
router.post(
  '/calculate-payslip',
  authorize('Admin', 'HR'),
  calculatePayslipValidator,
  validate,
  payrollController.calculateEmployeePayslip
);

// Get applicable contract for period
router.get(
  '/applicable-contract/:employeeId',
  authorize('Admin', 'HR'),
  payrollController.getApplicableContract
);

// Get real-time operational dashboard summary metrics
router.get(
  '/dashboard',
  payrollController.getDashboardSummary
);

module.exports = router;
