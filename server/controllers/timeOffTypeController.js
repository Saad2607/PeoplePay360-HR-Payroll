const TimeOffType = require('../models/TimeOffType');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/time-off-types
 * @desc    Get all time off types
 * @access  Private
 */
const getTimeOffTypes = async (req, res, next) => {
  try {
    const { isActive, unit, allocationRequired } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }
    if (unit) filter.unit = unit;
    if (allocationRequired !== undefined) {
      filter.allocationRequired = allocationRequired === 'true' || allocationRequired === true;
    }

    const types = await TimeOffType.find(filter).sort({ name: 1 });
    return successResponse(res, types, 'Time off types retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/time-off-types/:id
 * @desc    Get time off type by ID
 * @access  Private
 */
const getTimeOffTypeById = async (req, res, next) => {
  try {
    const type = await TimeOffType.findById(req.params.id);
    if (!type) {
      return errorResponse(res, 'Time off type not found', 404);
    }
    return successResponse(res, type, 'Time off type retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/time-off-types
 * @desc    Create a new time off type
 * @access  Private (Admin, HR)
 */
const createTimeOffType = async (req, res, next) => {
  try {
    const type = await TimeOffType.create(req.body);
    return successResponse(res, type, 'Time off type created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/time-off-types/:id
 * @desc    Update time off type
 * @access  Private (Admin, HR)
 */
const updateTimeOffType = async (req, res, next) => {
  try {
    const type = await TimeOffType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!type) {
      return errorResponse(res, 'Time off type not found', 404);
    }

    return successResponse(res, type, 'Time off type updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/time-off-types/:id
 * @desc    Deactivate or remove time off type
 * @access  Private (Admin, HR)
 */
const deleteTimeOffType = async (req, res, next) => {
  try {
    const type = await TimeOffType.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!type) {
      return errorResponse(res, 'Time off type not found', 404);
    }

    return successResponse(res, type, 'Time off type deactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeOffTypes,
  getTimeOffTypeById,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType
};
