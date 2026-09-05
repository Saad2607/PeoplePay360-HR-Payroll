const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize, authorizeSelfOrRoles } = require('../middleware/auth');
const { HR_MANAGERS, ADMIN_ONLY } = require('../config/roles');
const { createEmployeeValidator, updateEmployeeValidator } = require('../validators/employeeValidator');
const validate = require('../middleware/validate');

// All employee routes require authentication
router.use(authenticate);

// GET all employees (Employee role gets own record; HR/Admin gets all with filters)
router.get('/', employeeController.getAllEmployees);

// GET employee by ID (Employee can only view self; HR/Admin can view any)
router.get(
  '/:id',
  authorizeSelfOrRoles((req) => req.params.id, HR_MANAGERS),
  employeeController.getEmployeeById
);

// POST create employee (HR Managers, Admin)
router.post(
  '/',
  authorize(...HR_MANAGERS),
  createEmployeeValidator,
  validate,
  employeeController.createEmployee
);

// PUT update employee (HR Managers, Admin)
router.put(
  '/:id',
  authorize(...HR_MANAGERS),
  updateEmployeeValidator,
  validate,
  employeeController.updateEmployee
);

// DELETE employee (Admin only)
router.delete(
  '/:id',
  authorize(...ADMIN_ONLY),
  employeeController.deleteEmployee
);

module.exports = router;
