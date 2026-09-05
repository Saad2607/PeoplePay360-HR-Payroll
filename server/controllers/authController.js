const authService = require('../services/authService');
const { successResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public / Admin / HR
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, employee } = req.body;
    const result = await authService.registerUser({
      name,
      email,
      password,
      role,
      employee
    });

    return successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get JWT token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return successResponse(res, result, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user details
 * @access  Private (Authenticated)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);
    return successResponse(res, user, 'Current user profile retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Log out current user (stateless JWT acknowledgment)
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    return successResponse(res, null, 'Logged out successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/users
 * @desc    Get all users with filtering and pagination (Admin only)
 * @access  Private (Admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const result = await authService.getAllUsers(req.query);
    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.users,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/auth/users/:id/role
 * @desc    Update a user's role (Admin only)
 * @access  Private (Admin)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await authService.updateUserRole(req.params.id, role);
    return successResponse(res, user, `User role updated to ${role} successfully`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/auth/users/:id/status
 * @desc    Toggle a user's active/deactivated status (Admin only)
 * @access  Private (Admin)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await authService.toggleUserStatus(req.params.id, isActive);
    return successResponse(
      res,
      user,
      `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  getAllUsers,
  updateUserRole,
  toggleUserStatus
};
