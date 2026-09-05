const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { HR_MANAGERS, ADMIN_ONLY } = require('../config/roles');

router.use(authenticate);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', authorize(...HR_MANAGERS), departmentController.createDepartment);
router.put('/:id', authorize(...HR_MANAGERS), departmentController.updateDepartment);
router.delete('/:id', authorize(...ADMIN_ONLY), departmentController.deleteDepartment);

module.exports = router;
