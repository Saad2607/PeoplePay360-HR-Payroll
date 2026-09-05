const { body } = require('express-validator');

const createDepartmentValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Department code is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Department code must be between 2 and 10 characters')
    .toUpperCase(),

  body('manager')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Manager must be a valid MongoDB ObjectId'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const updateDepartmentValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department name cannot be empty')
    .isLength({ max: 100 }),

  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 })
    .toUpperCase(),

  body('manager')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Manager must be a valid MongoDB ObjectId')
];

module.exports = {
  createDepartmentValidator,
  updateDepartmentValidator
};
