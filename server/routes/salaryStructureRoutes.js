const express = require('express');
const router = express.Router();
const salaryStructureController = require('../controllers/salaryStructureController');
const { authenticate, authorize } = require('../middleware/auth');
const { PAYROLL_MANAGERS, PAYROLL_USERS } = require('../config/roles');
const validate = require('../middleware/validate');
const {
  createSalaryStructureValidator,
  updateSalaryStructureValidator
} = require('../validators/payrollValidator');

// All salary structure routes require authentication
router.use(authenticate);

// Read-only access for all payroll personnel
router.get('/', authorize(...PAYROLL_USERS), salaryStructureController.getSalaryStructures);
router.get('/:id', authorize(...PAYROLL_USERS), salaryStructureController.getSalaryStructureById);

// Salary structure template configuration strictly restricted to HR Payroll Managers & Admins
router.post(
  '/',
  authorize(...PAYROLL_MANAGERS),
  createSalaryStructureValidator,
  validate,
  salaryStructureController.createSalaryStructure
);

router.put(
  '/:id',
  authorize(...PAYROLL_MANAGERS),
  updateSalaryStructureValidator,
  validate,
  salaryStructureController.updateSalaryStructure
);

router.delete(
  '/:id',
  authorize(...PAYROLL_MANAGERS),
  salaryStructureController.deleteSalaryStructure
);

module.exports = router;
