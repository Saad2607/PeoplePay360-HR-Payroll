const { body } = require('express-validator');

const createScheduleValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Schedule name is required')
    .isLength({ max: 100 })
    .withMessage('Schedule name cannot exceed 100 characters'),

  body('type')
    .optional()
    .isIn(['Standard', 'Flexible', 'Shift', 'Part-Time'])
    .withMessage('Type must be one of: Standard, Flexible, Shift, Part-Time'),

  body('weeklyWorkingDays')
    .isArray({ min: 1 })
    .withMessage('weeklyWorkingDays must be an array with at least one active day')
    .custom((days) => {
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const invalid = days.filter((d) => !validDays.includes(d));
      if (invalid.length > 0) {
        throw new Error(`Invalid day(s) specified: ${invalid.join(', ')}`);
      }
      return true;
    }),

  body('startTime')
    .trim()
    .notEmpty()
    .withMessage('startTime is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('startTime must be in HH:MM format (24-hour clock, e.g. 09:00)'),

  body('endTime')
    .trim()
    .notEmpty()
    .withMessage('endTime is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('endTime must be in HH:MM format (24-hour clock, e.g. 17:00)'),

  body('breakDuration')
    .optional()
    .isFloat({ min: 0, max: 240 })
    .withMessage('breakDuration must be a number between 0 and 240 minutes')
];

const updateScheduleValidator = [
  body('startTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('startTime must be in HH:MM format (24-hour clock)'),

  body('endTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('endTime must be in HH:MM format (24-hour clock)'),

  body('breakDuration')
    .optional()
    .isFloat({ min: 0, max: 240 })
    .withMessage('breakDuration must be a number between 0 and 240 minutes')
];

const assignEmployeeScheduleValidator = [
  body('employeeId')
    .notEmpty()
    .withMessage('employeeId is required')
    .isMongoId()
    .withMessage('employeeId must be a valid MongoDB ObjectId'),

  body('scheduleId')
    .notEmpty()
    .withMessage('scheduleId is required')
    .isMongoId()
    .withMessage('scheduleId must be a valid MongoDB ObjectId')
];

const assignContractScheduleValidator = [
  body('contractId')
    .notEmpty()
    .withMessage('contractId is required')
    .isMongoId()
    .withMessage('contractId must be a valid MongoDB ObjectId'),

  body('scheduleId')
    .notEmpty()
    .withMessage('scheduleId is required')
    .isMongoId()
    .withMessage('scheduleId must be a valid MongoDB ObjectId')
];

module.exports = {
  createScheduleValidator,
  updateScheduleValidator,
  assignEmployeeScheduleValidator,
  assignContractScheduleValidator
};
