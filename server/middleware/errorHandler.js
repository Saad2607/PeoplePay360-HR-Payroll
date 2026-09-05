const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value '${value}' for field '${field}'. Must be unique.`;
    errors = [{ field, message }];
  }

  // Mongoose invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource identifier format for '${err.path}'`;
    errors = [{ field: err.path, value: err.value, message }];
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  return errorResponse(
    res,
    message,
    statusCode,
    errors,
    process.env.NODE_ENV === 'development' ? err.stack : null
  );
};

module.exports = errorHandler;
