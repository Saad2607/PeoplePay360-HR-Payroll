const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const { ROLES, HR_MANAGERS } = require('../config/roles');

/**
 * Authentication Middleware
 * Validates JWT token from Authorization header and attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Access denied. No authentication token provided.', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    // Hydrate user from database to ensure user is active and exists
    const user = await User.findById(decoded.id).populate('employee');
    if (!user) {
      return errorResponse(res, 'User associated with this token no longer exists.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your user account has been deactivated. Please contact an Administrator.', 403);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid authentication token.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired. Please sign in again.', 401);
    }
    return next(error);
  }
};

/**
 * Role-based Authorization Middleware (Protected route middleware)
 * @param  {...string} allowedRoles - e.g. (ROLES.HR_MANAGER, ROLES.ADMIN)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before authorization check.', 401);
    }

    // Admin always has full access
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
};

/**
 * Self-or-Privileged Authorization Middleware
 * Allows an Employee to access their own resource, while privileged roles (e.g. HR Manager, Admin)
 * can access any employee resource.
 * @param {Function} getTargetEmployeeId - Function taking (req) and returning the target employeeId string
 * @param {Array<string>} [privilegedRoles] - Roles allowed to bypass self-check
 */
const authorizeSelfOrRoles = (getTargetEmployeeId, privilegedRoles = HR_MANAGERS) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    // If user is Admin or has one of the privileged roles, allow
    if (req.user.role === ROLES.ADMIN || privilegedRoles.includes(req.user.role)) {
      return next();
    }

    // If user is Employee, check if the resource belongs to them
    const targetEmployeeId = getTargetEmployeeId(req);
    const userEmployeeId = req.user.employee?._id?.toString() || req.user.employee?.toString();

    if (userEmployeeId && targetEmployeeId && userEmployeeId === targetEmployeeId.toString()) {
      return next();
    }

    return errorResponse(
      res,
      'Forbidden: Employees can only view or manage their own records.',
      403
    );
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeSelfOrRoles
};
