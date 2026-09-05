const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user
 */
const registerUser = async ({ name, email, password, role, employee }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Employee',
    employee: employee || null
  });

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee: user.employee,
      isActive: user.isActive
    },
    token
  };
};

/**
 * Login user with credentials
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password').populate('employee');
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Your account is deactivated. Please contact HR or an Administrator.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee: user.employee,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    },
    token
  };
};

/**
 * Get currently authenticated user profile
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId)
    .populate({
      path: 'employee',
      populate: [
        { path: 'department' },
        { path: 'jobPosition' },
        { path: 'workingSchedule' },
        { path: 'activeContract' },
        { path: 'manager', select: 'name email employeeId' }
      ]
    });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Get all users with search, role filter, and pagination (Admin only)
 */
const getAllUsers = async (query = {}) => {
  const { search, role, isActive, page = 1, limit = 20 } = query;
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (typeof isActive !== 'undefined' && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (search && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } }
    ];
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate({
        path: 'employee',
        select: 'employeeId name department jobPosition status',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'jobPosition', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    User.countDocuments(filter)
  ]);

  return {
    users,
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l)
  };
};

/**
 * Update user role (Admin only)
 */
const updateUserRole = async (userId, newRole) => {
  const { ALL_ROLES } = require('../config/roles');
  if (!ALL_ROLES.includes(newRole)) {
    const error = new Error(`Invalid role '${newRole}'. Allowed roles: ${ALL_ROLES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  user.role = newRole;
  await user.save({ validateBeforeSave: false });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
};

/**
 * Toggle user active status (Admin only)
 */
const toggleUserStatus = async (userId, isActive) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  user.isActive = typeof isActive === 'boolean' ? isActive : !user.isActive;
  await user.save({ validateBeforeSave: false });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getAllUsers,
  updateUserRole,
  toggleUserStatus
};
