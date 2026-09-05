const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const WorkingSchedule = require('../models/WorkingSchedule');
const { getApplicableContract } = require('./contractService');
const { ROLES, hasRole } = require('../config/roles');

/**
 * Shared Backend Services Library
 * Built specifically for Krish (Payroll/Attendance) and Jay/Abhishek (Frontend integration).
 */

/**
 * 1. Employee Lookup
 * Find employee by MongoDB _id, employeeId string (e.g. "EMP001"), or email.
 * @param {string|ObjectId} identifier - ID, employeeId, or email
 * @param {Object} [options] - Options: { populate: ['department', 'jobPosition', 'workingSchedule', 'activeContract'] }
 * @returns {Promise<Object>} Hydrated employee document
 */
const lookupEmployee = async (identifier, options = {}) => {
  if (!identifier) {
    const error = new Error('Employee identifier is required for lookup.');
    error.statusCode = 400;
    throw error;
  }

  let query;
  if (mongoose.Types.ObjectId.isValid(identifier) && identifier.toString().length === 24) {
    query = Employee.findById(identifier);
  } else {
    query = Employee.findOne({
      $or: [
        { employeeId: identifier.toString().toUpperCase() },
        { email: identifier.toString().toLowerCase() }
      ]
    });
  }

  if (options.populate) {
    options.populate.forEach((path) => {
      query = query.populate(path);
    });
  } else {
    query = query
      .populate('department', 'name code')
      .populate('jobPosition', 'name')
      .populate('workingSchedule')
      .populate('activeContract');
  }

  const employee = await query.exec();
  if (!employee) {
    const error = new Error(`Employee not found with identifier: '${identifier}'`);
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

/**
 * 2. Contract Lookup
 * Find contract by MongoDB _id or contractNumber (e.g. "CTR-2024-001").
 * @param {string|ObjectId} identifier - ID or contractNumber
 * @param {Object} [options] - Optional populations
 * @returns {Promise<Object>} Hydrated contract document
 */
const lookupContract = async (identifier, options = {}) => {
  if (!identifier) {
    const error = new Error('Contract identifier is required for lookup.');
    error.statusCode = 400;
    throw error;
  }

  let query;
  if (mongoose.Types.ObjectId.isValid(identifier) && identifier.toString().length === 24) {
    query = Contract.findById(identifier);
  } else {
    query = Contract.findOne({ contractNumber: identifier.toString().toUpperCase() });
  }

  if (options.populate) {
    options.populate.forEach((path) => {
      query = query.populate(path);
    });
  } else {
    query = query
      .populate('employee', 'name email employeeId')
      .populate('department', 'name code')
      .populate('jobPosition', 'name')
      .populate('workingSchedule');
  }

  const contract = await query.exec();
  if (!contract) {
    const error = new Error(`Contract not found with identifier: '${identifier}'`);
    error.statusCode = 404;
    throw error;
  }

  return contract;
};

/**
 * 3. Active Contract Lookup
 * Retrieve the active contract currently in force for an employee.
 * @param {string|ObjectId} employeeId
 * @returns {Promise<Object|null>} Active contract or null
 */
const lookupActiveContract = async (employeeId) => {
  if (!employeeId) {
    const error = new Error('employeeId is required for active contract lookup.');
    error.statusCode = 400;
    throw error;
  }

  const contract = await Contract.findOne({
    employee: employeeId,
    status: 'Active'
  })
    .populate('department', 'name code')
    .populate('jobPosition', 'name')
    .populate('workingSchedule')
    .sort({ startDate: -1 });

  return contract;
};

/**
 * 4. Applicable Contract Retrieval
 * Period-specific contract lookup. Guaranteed to match the contract effective during the given pay period.
 * @param {string|ObjectId} employeeId
 * @param {Object|string|Date} payrollPeriod - { startDate, endDate } or date
 * @returns {Promise<Object>} Applicable contract document
 */
const lookupApplicableContract = async (employeeId, payrollPeriod) => {
  return getApplicableContract(employeeId, payrollPeriod);
};

/**
 * 5. Schedule Lookup
 * Retrieve working schedule details by ID or name.
 * @param {string|ObjectId} identifier - Schedule ObjectId or schedule name
 * @returns {Promise<Object>}
 */
const lookupSchedule = async (identifier) => {
  if (!identifier) {
    const error = new Error('Schedule identifier is required.');
    error.statusCode = 400;
    throw error;
  }

  let query;
  if (mongoose.Types.ObjectId.isValid(identifier) && identifier.toString().length === 24) {
    query = WorkingSchedule.findById(identifier);
  } else {
    query = WorkingSchedule.findOne({ name: identifier.toString() });
  }

  const schedule = await query.exec();
  if (!schedule) {
    const error = new Error(`Working Schedule not found with identifier: '${identifier}'`);
    error.statusCode = 404;
    throw error;
  }

  return schedule;
};

/**
 * 6. Date Range Validation Helper
 * Ensures dates are valid and start <= end.
 * @param {Date|string} startDate
 * @param {Date|string} [endDate]
 * @param {Object} [options] - Custom field names
 * @returns {{ start: Date, end: Date|null }} Parsed dates
 */
const validateDateRange = (startDate, endDate = null, options = {}) => {
  const startField = options.startField || 'startDate';
  const endField = options.endField || 'endDate';

  if (!startDate) {
    const error = new Error(`${startField} is required.`);
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    const error = new Error(`${startField} must be a valid ISO8601 date.`);
    error.statusCode = 400;
    throw error;
  }

  let end = null;
  if (endDate) {
    end = new Date(endDate);
    if (isNaN(end.getTime())) {
      const error = new Error(`${endField} must be a valid ISO8601 date.`);
      error.statusCode = 400;
      throw error;
    }

    if (end < start) {
      const error = new Error(`${endField} (${endDate}) cannot be earlier than ${startField} (${startDate}).`);
      error.statusCode = 400;
      throw error;
    }
  }

  return { start, end };
};

/**
 * 7. Role Checking Helper
 * @param {Object} user - User object with .role
 * @param {Array<string>} allowedRoles - Allowed roles
 * @returns {boolean}
 */
const checkUserRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  return hasRole(user.role, allowedRoles);
};

/**
 * Assert User Permission (throws 403 error if unauthorized)
 * @param {Object} user
 * @param {Array<string>} allowedRoles
 * @param {string} [actionDescription='perform this action']
 */
const assertUserPermission = (user, allowedRoles, actionDescription = 'perform this action') => {
  if (!checkUserRole(user, allowedRoles)) {
    const userRole = user?.role || 'Unauthenticated';
    const error = new Error(
      `Forbidden: Role '${userRole}' is not authorized to ${actionDescription}. Allowed role(s): ${allowedRoles.join(', ')}`
    );
    error.statusCode = 403;
    throw error;
  }
};

/**
 * 8. Standard Pagination Query Builder
 * @param {Object} params - { page, limit, maxLimit }
 * @returns {{ page: number, limit: number, skip: number }}
 */
const buildPaginationQuery = ({ page = 1, limit = 20, maxLimit = 100 } = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;
  return { page: p, limit: l, skip };
};

/**
 * 9. Standard Search Query Builder
 * Builds a multi-field case-insensitive regex search query for MongoDB
 * @param {string} searchTerm
 * @param {Array<string>} searchFields - e.g. ['name', 'email', 'employeeId']
 * @returns {Object} MongoDB $or filter
 */
const buildSearchQuery = (searchTerm, searchFields = []) => {
  if (!searchTerm || !searchFields || searchFields.length === 0) {
    return {};
  }

  const cleanTerm = searchTerm.toString().trim();
  if (!cleanTerm) return {};

  return {
    $or: searchFields.map((field) => ({
      [field]: { $regex: cleanTerm, $options: 'i' }
    }))
  };
};

/**
 * 10. Standard Error Creator
 * Creates an Error object with status code and optional details
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {Array|Object} [errors=null]
 * @returns {Error}
 */
const createCustomError = (message, statusCode = 500, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) error.errors = errors;
  return error;
};

module.exports = {
  lookupEmployee,
  lookupContract,
  lookupActiveContract,
  lookupApplicableContract,
  lookupSchedule,
  validateDateRange,
  checkUserRole,
  assertUserPermission,
  buildPaginationQuery,
  buildSearchQuery,
  createCustomError
};
