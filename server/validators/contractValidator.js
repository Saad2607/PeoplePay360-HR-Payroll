const { body, query } = require('express-validator');

/**
 * Validator for creating a contract
 */
const createContractValidator = [
  body('contractNumber')
    .trim()
    .notEmpty()
    .withMessage('Contract number is required')
    .toUpperCase(),

  body('employee')
    .notEmpty()
    .withMessage('Employee reference is required')
    .isMongoId()
    .withMessage('Employee must be a valid MongoDB ObjectId'),

  body('startDate')
    .notEmpty()
    .withMessage('Contract start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date')
    .custom((endDate, { req }) => {
      if (endDate && req.body.startDate) {
        const start = new Date(req.body.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('Contract end date cannot be earlier than start date');
        }
      }
      return true;
    }),

  body('wage')
    .notEmpty()
    .withMessage('Wage/Compensation amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Wage must be a positive number greater than zero'),

  body('wageType')
    .optional()
    .isIn(['Monthly', 'Hourly', 'Annual'])
    .withMessage('Wage type must be one of: Monthly, Hourly, Annual'),

  body('salaryStructure')
    .notEmpty()
    .withMessage('Salary structure is required')
    .isObject()
    .withMessage('Salary structure must be an object'),

  body('salaryStructure.basic')
    .notEmpty()
    .withMessage('Basic salary within salary structure is required')
    .isFloat({ min: 0 })
    .withMessage('Basic salary cannot be negative'),

  body('salaryStructure.allowances')
    .optional()
    .isObject()
    .withMessage('Allowances must be an object'),

  body('salaryStructure.deductions')
    .optional()
    .isObject()
    .withMessage('Deductions must be an object'),

  body('department')
    .notEmpty()
    .withMessage('Department reference is required')
    .isMongoId()
    .withMessage('Department must be a valid MongoDB ObjectId'),

  body('jobPosition')
    .notEmpty()
    .withMessage('Job position reference is required')
    .isMongoId()
    .withMessage('Job position must be a valid MongoDB ObjectId'),

  body('workingSchedule')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Working schedule must be a valid MongoDB ObjectId'),

  body('status')
    .optional()
    .isIn(['Draft', 'Active', 'Expired', 'Terminated'])
    .withMessage('Status must be one of: Draft, Active, Expired, Terminated')
];

/**
 * Validator for updating a contract
 */
const updateContractValidator = [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),

  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date')
    .custom((endDate, { req }) => {
      if (endDate && req.body.startDate) {
        const start = new Date(req.body.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('Contract end date cannot be earlier than start date');
        }
      }
      return true;
    }),

  body('wage')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Wage must be a positive number greater than zero'),

  body('salaryStructure.basic')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Basic salary cannot be negative'),

  body('status')
    .optional()
    .isIn(['Draft', 'Active', 'Expired', 'Terminated'])
    .withMessage('Status must be one of: Draft, Active, Expired, Terminated')
];

/**
 * Validator for applicable contract lookup
 */
const applicableContractValidator = [
  body('employeeId')
    .notEmpty()
    .withMessage('employeeId is required')
    .isMongoId()
    .withMessage('employeeId must be a valid MongoDB ObjectId'),

  body('payrollPeriod')
    .notEmpty()
    .withMessage('payrollPeriod object is required'),

  body('payrollPeriod.startDate')
    .notEmpty()
    .withMessage('payrollPeriod.startDate is required')
    .isISO8601()
    .withMessage('payrollPeriod.startDate must be a valid ISO8601 date'),

  body('payrollPeriod.endDate')
    .notEmpty()
    .withMessage('payrollPeriod.endDate is required')
    .isISO8601()
    .withMessage('payrollPeriod.endDate must be a valid ISO8601 date')
    .custom((endDate, { req }) => {
      if (endDate && req.body.payrollPeriod && req.body.payrollPeriod.startDate) {
        const start = new Date(req.body.payrollPeriod.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('Payroll period endDate cannot be earlier than startDate');
        }
      }
      return true;
    })
];

module.exports = {
  createContractValidator,
  updateContractValidator,
  applicableContractValidator
};
