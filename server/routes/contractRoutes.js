const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('Admin', 'HR'), contractController.getContracts);
router.get('/:id', contractController.getContractById);
router.get('/employee/:employeeId', contractController.getContractsByEmployee);
router.post('/', authorize('Admin', 'HR'), contractController.createContract);
router.put('/:id', authorize('Admin', 'HR'), contractController.updateContract);

module.exports = router;
