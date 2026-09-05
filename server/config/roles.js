/**
 * Roles and Permissions Configuration for PeoplePay360
 * Defines the 5 official roles and their backend access levels.
 */

const ROLES = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  ADMIN: 'Admin'
};

const ALL_ROLES = Object.values(ROLES);

// Grouped permissions for clean authorization
const HR_MANAGERS = [
  ROLES.HR_MANAGER,
  ROLES.HR_PAYROLL_USER,
  ROLES.HR_PAYROLL_MANAGER,
  ROLES.ADMIN
];

const PAYROLL_USERS = [
  ROLES.HR_PAYROLL_USER,
  ROLES.HR_PAYROLL_MANAGER,
  ROLES.ADMIN
];

const PAYROLL_MANAGERS = [
  ROLES.HR_PAYROLL_MANAGER,
  ROLES.ADMIN
];

const ADMIN_ONLY = [
  ROLES.ADMIN
];

/**
 * Permission checker utility
 */
const hasRole = (userRole, allowedRoles) => {
  if (!userRole) return false;
  if (userRole === ROLES.ADMIN) return true; // Admin has full access
  return allowedRoles.includes(userRole);
};

module.exports = {
  ROLES,
  ALL_ROLES,
  HR_MANAGERS,
  PAYROLL_USERS,
  PAYROLL_MANAGERS,
  ADMIN_ONLY,
  hasRole
};
