const { body, param, query } = require('express-validator');

const checkInValidator = [
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('employeeId must be a valid MongoDB ObjectId'),
  body('checkIn')
    .optional()
    .isISO8601()
    .withMessage('checkIn must be a valid ISO8601 date string'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const checkOutValidator = [
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('employeeId must be a valid MongoDB ObjectId'),
  body('checkOut')
    .optional()
    .isISO8601()
    .withMessage('checkOut must be a valid ISO8601 date string'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const manualCorrectionValidator = [
  param('id')
    .isMongoId()
    .withMessage('Attendance ID must be a valid MongoDB ObjectId'),
  body('reason')
    .notEmpty()
    .withMessage('Correction reason is mandatory for manual modifications')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Correction reason must be between 5 and 500 characters'),
  body('checkIn')
    .optional()
    .isISO8601()
    .withMessage('checkIn must be a valid ISO8601 date string'),
  body('checkOut')
    .optional()
    .isISO8601()
    .withMessage('checkOut must be a valid ISO8601 date string'),
  body('status')
    .optional()
    .isIn(['Present', 'Late', 'Half-Day', 'Absent', 'On Leave'])
    .withMessage('Invalid attendance status')
];

const attendanceQueryValidator = [
  query('employee')
    .optional()
    .isMongoId()
    .withMessage('employee must be a valid MongoDB ObjectId'),
  query('department')
    .optional()
    .isMongoId()
    .withMessage('department must be a valid MongoDB ObjectId'),
  query('status')
    .optional()
    .isIn(['Present', 'Late', 'Half-Day', 'Absent', 'On Leave'])
    .withMessage('Invalid status filter'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date'),
  query('missingCheckout')
    .optional()
    .isBoolean()
    .withMessage('missingCheckout must be true or false')
];

module.exports = {
  checkInValidator,
  checkOutValidator,
  manualCorrectionValidator,
  attendanceQueryValidator
};
