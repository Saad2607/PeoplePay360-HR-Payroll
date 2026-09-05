const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  wizardEligibleEmployeesValidator,
  createPayrunValidator,
  markPaidValidator
} = require('../validators/payrollValidator');
const { HR_MANAGERS, PAYROLL_USERS } = require('../config/roles');

// All payrun routes require authentication and Payroll authorization
router.use(authenticate);

// Wizard Step 2: Query eligible employees
router.post(
  '/wizard/eligible-employees',
  authorize(...PAYROLL_USERS),
  wizardEligibleEmployeesValidator,
  validate,
  payrunController.getEligibleEmployees
);

// Wizard Step 3: Create Payrun
router.post(
  '/',
  authorize(...PAYROLL_USERS),
  createPayrunValidator,
  validate,
  payrunController.createPayrun
);

// List & Retrieve Payruns (HR Managers can audit; Payroll Users can manage)
router.get(
  '/',
  authorize(...HR_MANAGERS),
  payrunController.getPayruns
);

router.get(
  '/:id',
  authorize(...HR_MANAGERS),
  payrunController.getPayrunById
);

router.post(
  '/:id/compute',
  authorize(...PAYROLL_USERS),
  payrunController.computePayrun
);

router.post(
  '/:id/validate',
  authorize(...PAYROLL_USERS),
  payrunController.validatePayrun
);

router.get(
  '/:id/validate',
  authorize(...PAYROLL_USERS),
  payrunController.checkValidation
);

router.post(
  '/:id/mark-paid',
  authorize(...PAYROLL_USERS),
  markPaidValidator,
  validate,
  payrunController.markPaid
);

router.post(
  '/:id/send-payslips',
  authorize(...PAYROLL_USERS),
  payrunController.sendPayslips
);

router.delete(
  '/:id',
  authorize(...PAYROLL_USERS),
  payrunController.deletePayrun
);

module.exports = router;
