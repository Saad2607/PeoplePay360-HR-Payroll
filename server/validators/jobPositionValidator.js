const { body } = require('express-validator');

const createJobPositionValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Job position name is required')
    .isLength({ max: 100 })
    .withMessage('Job position name cannot exceed 100 characters'),

  body('department')
    .notEmpty()
    .withMessage('Department reference is required')
    .isMongoId()
    .withMessage('Department must be a valid MongoDB ObjectId'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const updateJobPositionValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Job position name cannot be empty')
    .isLength({ max: 100 }),

  body('department')
    .optional()
    .isMongoId()
    .withMessage('Department must be a valid MongoDB ObjectId')
];

module.exports = {
  createJobPositionValidator,
  updateJobPositionValidator
};
