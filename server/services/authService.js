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

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};
