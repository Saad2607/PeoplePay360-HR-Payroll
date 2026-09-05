const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');
const { createEmployeeValidator } = require('../validators/employeeValidator');
const validate = require('../middleware/validate');

// All employee routes require authentication
router.use(authenticate);

router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', authorize('Admin', 'HR'), createEmployeeValidator, validate, employeeController.createEmployee);
router.put('/:id', authorize('Admin', 'HR'), employeeController.updateEmployee);
router.delete('/:id', authorize('Admin'), employeeController.deleteEmployee);

module.exports = router;
