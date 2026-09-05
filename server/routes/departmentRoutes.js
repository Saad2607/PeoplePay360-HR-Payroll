const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', authorize('Admin', 'HR'), departmentController.createDepartment);
router.put('/:id', authorize('Admin', 'HR'), departmentController.updateDepartment);

module.exports = router;
