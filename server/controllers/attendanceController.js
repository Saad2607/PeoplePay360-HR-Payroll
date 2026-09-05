const attendanceService = require('../services/attendanceService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check in an employee (self or on behalf if HR/Admin)
 * @access  Private (Employee, HR, Admin)
 */
const checkIn = async (req, res, next) => {
  try {
    const { employeeId, checkIn: checkInTime, notes } = req.body;
    const attendance = await attendanceService.checkIn({
      user: req.user,
      employeeId,
      checkInTime,
      notes
    });

    return successResponse(res, attendance, 'Checked in successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check out an employee (calculates worked hours & overtime)
 * @access  Private (Employee, HR, Admin)
 */
const checkOut = async (req, res, next) => {
  try {
    const { employeeId, checkOut: checkOutTime, notes } = req.body;
    const attendance = await attendanceService.checkOut({
      user: req.user,
      employeeId,
      checkOutTime,
      notes
    });

    return successResponse(res, attendance, 'Checked out successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/attendance/:id
 * @desc    Manually correct an attendance record with full audit logging
 * @access  Private (Admin, HR)
 */
const manualCorrection = async (req, res, next) => {
  try {
    const { checkIn, checkOut, status, reason } = req.body;
    const attendance = await attendanceService.manualCorrection(
      req.params.id,
      { checkIn, checkOut, status, reason },
      req.user
    );

    return successResponse(res, attendance, 'Attendance record corrected successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance
 * @desc    Get attendance records with filtering, searching, and pagination
 * @access  Private
 */
const getAllAttendance = async (req, res, next) => {
  try {
    const { attendance, total, page, limit } = await attendanceService.getAttendanceRecords(req.query, req.user);
    return paginatedResponse(res, attendance, page, limit, total, 'Attendance records retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/missing-checkout
 * @desc    Get records with missing checkout
 * @access  Private (Admin, HR)
 */
const getMissingCheckouts = async (req, res, next) => {
  try {
    const records = await attendanceService.getMissingCheckouts(req.user);
    return successResponse(res, records, 'Missing checkout records retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/:id
 * @desc    Get single attendance record by ID
 * @access  Private
 */
const getAttendanceById = async (req, res, next) => {
  try {
    const attendance = await attendanceService.getAttendanceById(req.params.id, req.user);
    return successResponse(res, attendance, 'Attendance record retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/employee/:employeeId
 * @desc    Get attendance history for a specific employee
 * @access  Private (Employee: own only; Admin/HR: any)
 */
const getEmployeeAttendance = async (req, res, next) => {
  try {
    const { attendance, total, page, limit } = await attendanceService.getEmployeeAttendanceHistory(
      req.params.employeeId,
      req.query,
      req.user
    );
    return paginatedResponse(res, attendance, page, limit, total, 'Employee attendance history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  manualCorrection,
  getAllAttendance,
  getMissingCheckouts,
  getAttendanceById,
  getEmployeeAttendance
};
