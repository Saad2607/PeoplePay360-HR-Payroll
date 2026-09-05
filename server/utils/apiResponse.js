/**
 * Standard API Response Formatter for PeoplePay360
 * Ensures consistent JSON responses across all endpoints.
 */

const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null, stack = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  if (stack && process.env.NODE_ENV === 'development') {
    response.stack = stack;
  }

  return res.status(statusCode).json(response);
};

const paginatedResponse = (res, data, page = 1, limit = 10, total = 0, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit) || 1;
  return successResponse(res, data, message, 200, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};
