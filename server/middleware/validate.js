const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware that checks express-validator results
 * Returns a clean 400 Bad Request with formatted error details
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return errorResponse(res, 'Validation Error: Invalid input parameters', 400, formattedErrors);
  }
  next();
};

module.exports = validate;
