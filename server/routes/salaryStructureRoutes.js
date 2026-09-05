const express = require('express');
const router = express.Router();
const salaryStructureController = require('../controllers/salaryStructureController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createSalaryStructureValidator,
  updateSalaryStructureValidator
} = require('../validators/payrollValidator');

// All salary structure routes require authentication
router.use(authenticate);

router.get('/', salaryStructureController.getSalaryStructures);
router.get('/:id', salaryStructureController.getSalaryStructureById);

// Admin & HR management
router.post(
  '/',
  authorize('Admin', 'HR'),
  createSalaryStructureValidator,
  validate,
  salaryStructureController.createSalaryStructure
);

router.put(
  '/:id',
  authorize('Admin', 'HR'),
  updateSalaryStructureValidator,
  validate,
  salaryStructureController.updateSalaryStructure
);

router.delete(
  '/:id',
  authorize('Admin', 'HR'),
  salaryStructureController.deleteSalaryStructure
);

module.exports = router;
