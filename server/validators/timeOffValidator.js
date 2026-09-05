const { body, param, query } = require('express-validator');

// Time Off Type Validators
const createTimeOffTypeValidator = [
  body('name')
    .notEmpty()
    .withMessage('Time off type name is required')
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('code')
    .notEmpty()
    .withMessage('Time off type code is required (e.g. PTO, SICK)')
    .isString()
    .trim()
    .toUpperCase()
    .isLength({ min: 2, max: 20 })
    .withMessage('Code must be between 2 and 20 characters'),
  body('unit')
    .optional()
    .isIn(['days', 'hours'])
    .withMessage('Unit must be either "days" or "hours"'),
  body('allocationRequired')
    .optional()
    .isBoolean()
    .withMessage('allocationRequired must be true or false'),
  body('approvalWorkflow')
    .optional()
    .isIn(['None', 'Manager', 'HR', 'Manager_and_HR'])
    .withMessage('Invalid approval workflow'),
  body('payrollIntegration.affectsPayroll')
    .optional()
    .isBoolean()
    .withMessage('affectsPayroll must be boolean'),
  body('payrollIntegration.isPaid')
    .optional()
    .isBoolean()
    .withMessage('isPaid must be boolean')
];

const updateTimeOffTypeValidator = [
  param('id')
    .isMongoId()
    .withMessage('Time Off Type ID must be a valid MongoDB ObjectId'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
  body('code')
    .optional()
    .isString()
    .trim()
    .toUpperCase(),
  body('unit')
    .optional()
    .isIn(['days', 'hours']),
  body('allocationRequired')
    .optional()
    .isBoolean(),
  body('approvalWorkflow')
    .optional()
    .isIn(['None', 'Manager', 'HR', 'Manager_and_HR']),
  body('isActive')
    .optional()
    .isBoolean()
];

// Allocation Validators
const createAllocationValidator = [
  body('employee')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('employee must be a valid MongoDB ObjectId'),
  body('timeOffType')
    .notEmpty()
    .withMessage('Time off type ID is required')
    .isMongoId()
    .withMessage('timeOffType must be a valid MongoDB ObjectId'),
  body('allocatedAmount')
    .notEmpty()
    .withMessage('Allocated amount is required')
    .isFloat({ min: 0 })
    .withMessage('Allocated amount must be a positive number'),
  body('validityPeriod.startDate')
    .notEmpty()
    .withMessage('Validity period start date is required')
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date'),
  body('validityPeriod.endDate')
    .notEmpty()
    .withMessage('Validity period end date is required')
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date'),
  body('status')
    .optional()
    .isIn(['Draft', 'Pending', 'Approved', 'Refused', 'Cancelled'])
    .withMessage('Invalid allocation status'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
];

const updateAllocationValidator = [
  param('id')
    .isMongoId()
    .withMessage('Allocation ID must be a valid MongoDB ObjectId'),
  body('allocatedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Allocated amount must be a positive number'),
  body('takenAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Taken amount must be a positive number'),
  body('validityPeriod.startDate')
    .optional()
    .isISO8601(),
  body('validityPeriod.endDate')
    .optional()
    .isISO8601(),
  body('status')
    .optional()
    .isIn(['Draft', 'Pending', 'Approved', 'Refused', 'Cancelled']),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
];

const allocationQueryValidator = [
  query('employee')
    .optional()
    .isMongoId()
    .withMessage('employee must be a valid MongoDB ObjectId'),
  query('timeOffType')
    .optional()
    .isMongoId()
    .withMessage('timeOffType must be a valid MongoDB ObjectId'),
  query('status')
    .optional()
    .isIn(['Draft', 'Pending', 'Approved', 'Refused', 'Cancelled'])
    .withMessage('Invalid status filter')
];

// Time Off Request Validators
const createTimeOffRequestValidator = [
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('employeeId must be a valid MongoDB ObjectId'),
  body('timeOffTypeId')
    .notEmpty()
    .withMessage('Time off type ID is required')
    .isMongoId()
    .withMessage('timeOffTypeId must be a valid MongoDB ObjectId'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date'),
  body('duration')
    .optional()
    .isFloat({ min: 0.5 })
    .withMessage('Duration must be at least 0.5'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Reason must be between 3 and 500 characters')
];

const refuseTimeOffRequestValidator = [
  param('id')
    .isMongoId()
    .withMessage('Time Off Request ID must be a valid MongoDB ObjectId'),
  body('refusalReason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Refusal reason cannot exceed 500 characters')
];

const timeOffRequestQueryValidator = [
  query('employee')
    .optional()
    .isMongoId()
    .withMessage('employee must be a valid MongoDB ObjectId'),
  query('timeOffType')
    .optional()
    .isMongoId()
    .withMessage('timeOffType must be a valid MongoDB ObjectId'),
  query('status')
    .optional()
    .isIn(['Pending', 'Approved', 'Refused', 'Cancelled'])
    .withMessage('Invalid status filter'),
  query('startDate')
    .optional()
    .isISO8601(),
  query('endDate')
    .optional()
    .isISO8601()
];

module.exports = {
  createTimeOffTypeValidator,
  updateTimeOffTypeValidator,
  createAllocationValidator,
  updateAllocationValidator,
  allocationQueryValidator,
  createTimeOffRequestValidator,
  refuseTimeOffRequestValidator,
  timeOffRequestQueryValidator
};
