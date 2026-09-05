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

module.exports = {
  createTimeOffTypeValidator,
  updateTimeOffTypeValidator
};
