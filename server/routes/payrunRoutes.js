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

// All payrun routes require authentication and HR/Payroll authorization
router.use(authenticate);

// Wizard Step 2: Query eligible employees
router.post(
  '/wizard/eligible-employees',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  wizardEligibleEmployeesValidator,
  validate,
  payrunController.getEligibleEmployees
);

// Wizard Step 3: Create Payrun
router.post(
  '/',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  createPayrunValidator,
  validate,
  payrunController.createPayrun
);

// List & Retrieve Payruns
router.get(
  '/',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  payrunController.getPayruns
);

router.get(
  '/:id',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  payrunController.getPayrunById
);

router.post(
  '/:id/compute',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  payrunController.computePayrun
);

router.post(
  '/:id/validate',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  payrunController.validatePayrun
);

router.get(
  '/:id/validate',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  payrunController.checkValidation
);

router.post(
  '/:id/mark-paid',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  markPaidValidator,
  validate,
  payrunController.markPaid
);

router.delete(
  '/:id',
  authorize(...(HR_MANAGERS || ['Admin', 'HR Manager', 'HR'])),
  payrunController.deletePayrun
);

module.exports = router;
