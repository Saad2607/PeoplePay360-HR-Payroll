const express = require('express');
const router = express.Router();
const salaryRuleController = require('../controllers/salaryRuleController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createSalaryRuleValidator,
  updateSalaryRuleValidator
} = require('../validators/payrollValidator');

// All salary rule routes require authentication
router.use(authenticate);

router.get('/', salaryRuleController.getSalaryRules);
router.get('/:id', salaryRuleController.getSalaryRuleById);

// Admin & HR management
router.post(
  '/',
  authorize('Admin', 'HR'),
  createSalaryRuleValidator,
  validate,
  salaryRuleController.createSalaryRule
);

router.put(
  '/:id',
  authorize('Admin', 'HR'),
  updateSalaryRuleValidator,
  validate,
  salaryRuleController.updateSalaryRule
);

router.delete(
  '/:id',
  authorize('Admin', 'HR'),
  salaryRuleController.deleteSalaryRule
);

module.exports = router;
