const WorkingSchedule = require('../models/WorkingSchedule');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/schedules
 * @desc    Get all working schedules
 * @access  Private
 */
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await WorkingSchedule.find({ isActive: true }).sort({ name: 1 });
    return successResponse(res, schedules, 'Working schedules retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/schedules/:id
 * @desc    Get working schedule by ID
 * @access  Private
 */
const getScheduleById = async (req, res, next) => {
  try {
    const schedule = await WorkingSchedule.findById(req.params.id);
    if (!schedule) {
      return errorResponse(res, 'Working schedule not found', 404);
    }
    return successResponse(res, schedule, 'Working schedule retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/schedules
 * @desc    Create a new working schedule
 * @access  Private (Admin, HR)
 */
const createSchedule = async (req, res, next) => {
  try {
    const schedule = await WorkingSchedule.create(req.body);
    return successResponse(res, schedule, 'Working schedule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule
};
