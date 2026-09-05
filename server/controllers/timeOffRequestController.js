const timeOffService = require('../services/timeOffService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/time-off-requests
 * @desc    Submit a new time off request (Employee for self; HR for employee)
 * @access  Private
 */
const createRequest = async (req, res, next) => {
  try {
    const { employeeId, timeOffTypeId, startDate, endDate, duration, reason } = req.body;
    const request = await timeOffService.createTimeOffRequest({
      user: req.user,
      employeeId,
      timeOffTypeId,
      startDate,
      endDate,
      duration,
      reason
    });

    return successResponse(res, request, 'Time off request submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/time-off-requests
 * @desc    Get time off requests (Employee: own only; HR/Admin: all with filters)
 * @access  Private
 */
const getAllRequests = async (req, res, next) => {
  try {
    const { requests, total, page, limit } = await timeOffService.getTimeOffRequests(req.query, req.user);
    return paginatedResponse(res, requests, page, limit, total, 'Time off requests retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/time-off-requests/:id
 * @desc    Get single time off request by ID
 * @access  Private
 */
const getRequestById = async (req, res, next) => {
  try {
    const request = await timeOffService.getTimeOffRequestById(req.params.id, req.user);
    return successResponse(res, request, 'Time off request retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/time-off-requests/employee/:employeeId
 * @desc    Get requests for specific employee
 * @access  Private
 */
const getEmployeeRequests = async (req, res, next) => {
  try {
    const { requests, total, page, limit } = await timeOffService.getEmployeeRequests(
      req.params.employeeId,
      req.query,
      req.user
    );
    return paginatedResponse(res, requests, page, limit, total, 'Employee time off requests retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/time-off-requests/:id/approve
 * @desc    Approve time off request and deduct from leave allocation
 * @access  Private (Admin, HR)
 */
const approveRequest = async (req, res, next) => {
  try {
    const result = await timeOffService.approveTimeOffRequest(req.params.id, req.user);
    return successResponse(
      res,
      result,
      'Time off request approved successfully and allocation balance deducted'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/time-off-requests/:id/refuse
 * @desc    Refuse/Reject time off request (no allocation deduction)
 * @access  Private (Admin, HR)
 */
const refuseRequest = async (req, res, next) => {
  try {
    const { refusalReason } = req.body;
    const request = await timeOffService.refuseTimeOffRequest(req.params.id, refusalReason, req.user);
    return successResponse(res, request, 'Time off request refused successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/time-off-requests/:id/cancel
 * @desc    Cancel time off request (restores allocation balance if approved)
 * @access  Private
 */
const cancelRequest = async (req, res, next) => {
  try {
    const result = await timeOffService.cancelTimeOffRequest(req.params.id, req.user);
    return successResponse(res, result, 'Time off request cancelled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  getEmployeeRequests,
  approveRequest,
  refuseRequest,
  cancelRequest
};
