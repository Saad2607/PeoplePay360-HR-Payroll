const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { HR_MANAGERS, ADMIN_ONLY } = require('../config/roles');
const { createDepartmentValidator, updateDepartmentValidator } = require('../validators/departmentValidator');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', authorize(...HR_MANAGERS), createDepartmentValidator, validate, departmentController.createDepartment);
router.put('/:id', authorize(...HR_MANAGERS), updateDepartmentValidator, validate, departmentController.updateDepartment);
router.delete('/:id', authorize(...ADMIN_ONLY), departmentController.deleteDepartment);

module.exports = router;
