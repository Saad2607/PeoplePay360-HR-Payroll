const { body } = require('express-validator');

const createEmployeeValidator = [
  body('employeeId')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required')
    .toUpperCase(),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Employee name is required')
    .isLength({ max: 120 })
    .withMessage('Name cannot exceed 120 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('department')
    .notEmpty()
    .withMessage('Department ID is required')
    .isMongoId()
    .withMessage('Department must be a valid MongoDB ObjectId'),
  body('jobPosition')
    .notEmpty()
    .withMessage('Job position ID is required')
    .isMongoId()
    .withMessage('Job position must be a valid MongoDB ObjectId'),
  body('workingSchedule')
    .notEmpty()
    .withMessage('Working schedule ID is required')
    .isMongoId()
    .withMessage('Working schedule must be a valid MongoDB ObjectId'),
  body('manager')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Manager must be a valid MongoDB ObjectId'),
  body('employeeType')
    .optional()
    .isIn(['Full-Time', 'Part-Time', 'Contract', 'Intern'])
    .withMessage('Invalid employee type'),
  body('joiningDate')
    .optional()
    .isISO8601()
    .withMessage('Joining date must be a valid ISO8601 date'),
  body('status')
    .optional()
    .isIn(['Active', 'On Leave', 'Terminated', 'Probation'])
    .withMessage('Invalid employee status')
];

const updateEmployeeValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Employee name cannot be empty')
    .isLength({ max: 120 }),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('department')
    .optional()
    .isMongoId()
    .withMessage('Department must be a valid MongoDB ObjectId'),

  body('jobPosition')
    .optional()
    .isMongoId()
    .withMessage('Job position must be a valid MongoDB ObjectId'),

  body('workingSchedule')
    .optional()
    .isMongoId()
    .withMessage('Working schedule must be a valid MongoDB ObjectId'),

  body('manager')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Manager must be a valid MongoDB ObjectId')
    .custom((managerId, { req }) => {
      if (managerId && req.params && req.params.id && managerId.toString() === req.params.id.toString()) {
        throw new Error('An employee cannot be assigned as their own manager');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['Active', 'On Leave', 'Terminated', 'Probation'])
    .withMessage('Invalid employee status')
];

module.exports = {
  createEmployeeValidator,
  updateEmployeeValidator
};
