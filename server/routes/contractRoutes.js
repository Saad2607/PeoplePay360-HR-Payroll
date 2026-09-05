const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate, authorize } = require('../middleware/auth');
const { HR_MANAGERS, ADMIN_ONLY } = require('../config/roles');
const {
  createContractValidator,
  updateContractValidator,
  applicableContractValidator
} = require('../validators/contractValidator');
const validate = require('../middleware/validate');

router.use(authenticate);

// List all contracts (filter by status, department, employee)
router.get('/', authorize(...HR_MANAGERS), contractController.getContracts);

// Active contract retrieval
router.get('/active/:employeeId', contractController.getActiveContract);

// Contract history lookup by employee ID
router.get('/employee/:employeeId', contractController.getContractsByEmployee);

// Period-Specific Applicable Contract Engine (Critical business rule for Payroll)
router.post(
  '/applicable',
  authorize(...HR_MANAGERS),
  applicableContractValidator,
  validate,
  contractController.getApplicableContract
);
router.get('/applicable/:employeeId', authorize(...HR_MANAGERS), contractController.getApplicableContractByQuery);

// Contract by ID
router.get('/:id', contractController.getContractById);

// Create contract (with overlap validation)
router.post(
  '/',
  authorize(...HR_MANAGERS),
  createContractValidator,
  validate,
  contractController.createContract
);

// Update contract
router.put(
  '/:id',
  authorize(...HR_MANAGERS),
  updateContractValidator,
  validate,
  contractController.updateContract
);

// Delete contract
router.delete('/:id', authorize(...ADMIN_ONLY), contractController.deleteContract);

module.exports = router;
