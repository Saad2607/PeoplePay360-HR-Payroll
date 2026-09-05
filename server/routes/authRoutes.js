const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { ADMIN_ONLY } = require('../config/roles');

// Public routes
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

// Admin User Management routes
router.get('/users', authenticate, authorize(...ADMIN_ONLY), authController.getAllUsers);
router.patch('/users/:id/role', authenticate, authorize(...ADMIN_ONLY), authController.updateUserRole);
router.patch('/users/:id/status', authenticate, authorize(...ADMIN_ONLY), authController.toggleUserStatus);

module.exports = router;
