const express = require('express');
const router = express.Router();
const salaryRuleController = require('../controllers/salaryRuleController');
const { authenticate, authorize } = require('../middleware/auth');
const { PAYROLL_MANAGERS, PAYROLL_USERS } = require('../config/roles');
const validate = require('../middleware/validate');
const {
  createSalaryRuleValidator,
  updateSalaryRuleValidator
} = require('../validators/payrollValidator');

// All salary rule routes require authentication
router.use(authenticate);

// Read-only access for all payroll personnel
router.get('/', authorize(...PAYROLL_USERS), salaryRuleController.getSalaryRules);
router.get('/:id', authorize(...PAYROLL_USERS), salaryRuleController.getSalaryRuleById);

// Salary rule configuration strictly restricted to HR Payroll Managers & Admins
router.post(
  '/',
  authorize(...PAYROLL_MANAGERS),
  createSalaryRuleValidator,
  validate,
  salaryRuleController.createSalaryRule
);

router.put(
  '/:id',
  authorize(...PAYROLL_MANAGERS),
  updateSalaryRuleValidator,
  validate,
  salaryRuleController.updateSalaryRule
);

router.delete(
  '/:id',
  authorize(...PAYROLL_MANAGERS),
  salaryRuleController.deleteSalaryRule
);

module.exports = router;
