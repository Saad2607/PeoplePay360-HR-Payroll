const { body, param, query } = require('express-validator');

// Salary Structure Validators
const createSalaryStructureValidator = [
  body('name')
    .notEmpty()
    .withMessage('Salary structure name is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('Name must be between 3 and 120 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 }),
  body('salaryRules')
    .optional()
    .isArray()
    .withMessage('salaryRules must be an array of rule IDs'),
  body('salaryRules.*')
    .optional()
    .isMongoId()
    .withMessage('Each salary rule must be a valid MongoDB ObjectId'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
];

const updateSalaryStructureValidator = [
  param('id')
    .isMongoId()
    .withMessage('Salary Structure ID must be a valid MongoDB ObjectId'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 120 }),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 }),
  body('salaryRules')
    .optional()
    .isArray(),
  body('salaryRules.*')
    .optional()
    .isMongoId(),
  body('isActive')
    .optional()
    .isBoolean()
];

// Salary Rule Validators
const createSalaryRuleValidator = [
  body('name')
    .notEmpty()
    .withMessage('Salary rule name is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('code')
    .notEmpty()
    .withMessage('Salary rule code is required (e.g. BASIC, HRA, GROSS)')
    .isString()
    .trim()
    .toUpperCase()
    .isLength({ min: 2, max: 30 })
    .withMessage('Code must be between 2 and 30 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Code must only contain uppercase letters, numbers, and underscores'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Basic', 'Allowances', 'Gross', 'Deductions', 'Net'])
    .withMessage('Category must be one of: Basic, Allowances, Gross, Deductions, Net'),
  body('sequence')
    .notEmpty()
    .withMessage('Sequence number is required for execution order')
    .isInt({ min: 1 })
    .withMessage('Sequence must be a positive integer'),
  body('computationType')
    .notEmpty()
    .withMessage('Computation type is required')
    .isIn(['Fixed amount', 'Percentage', 'Formula'])
    .withMessage('Computation type must be: Fixed amount, Percentage, or Formula'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a non-negative number'),
  body('percentageBase')
    .optional()
    .isString()
    .trim()
    .toUpperCase(),
  body('formula')
    .optional()
    .isString()
    .trim(),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 }),
  body('isActive')
    .optional()
    .isBoolean()
];

const updateSalaryRuleValidator = [
  param('id')
    .isMongoId()
    .withMessage('Salary Rule ID must be a valid MongoDB ObjectId'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('code')
    .optional()
    .isString()
    .trim()
    .toUpperCase()
    .matches(/^[A-Z0-9_]+$/),
  body('category')
    .optional()
    .isIn(['Basic', 'Allowances', 'Gross', 'Deductions', 'Net']),
  body('sequence')
    .optional()
    .isInt({ min: 1 }),
  body('computationType')
    .optional()
    .isIn(['Fixed amount', 'Percentage', 'Formula']),
  body('amount')
    .optional()
    .isFloat({ min: 0 }),
  body('percentageBase')
    .optional()
    .isString()
    .trim()
    .toUpperCase(),
  body('formula')
    .optional()
    .isString()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
];

// Payslip Calculation Validator
const calculatePayslipValidator = [
  body('employeeId')
    .notEmpty()
    .withMessage('employeeId is required')
    .isMongoId()
    .withMessage('employeeId must be a valid MongoDB ObjectId'),
  body('period.startDate')
    .notEmpty()
    .withMessage('period.startDate is required')
    .isISO8601()
    .withMessage('period.startDate must be an ISO8601 date'),
  body('period.endDate')
    .notEmpty()
    .withMessage('period.endDate is required')
    .isISO8601()
    .withMessage('period.endDate must be an ISO8601 date'),
  body('salaryStructureId')
    .optional()
    .isMongoId()
    .withMessage('salaryStructureId must be a valid MongoDB ObjectId')
];

module.exports = {
  createSalaryStructureValidator,
  updateSalaryStructureValidator,
  createSalaryRuleValidator,
  updateSalaryRuleValidator,
  calculatePayslipValidator
};
