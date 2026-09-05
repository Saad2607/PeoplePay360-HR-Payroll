const JobPosition = require('../models/JobPosition');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/job-positions
 * @desc    Get all job positions (optionally filter by department)
 * @access  Private
 */
const getJobPositions = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.department) {
      filter.department = req.query.department;
    }

    const positions = await JobPosition.find(filter)
      .populate('department', 'name code')
      .sort({ name: 1 });

    return successResponse(res, positions, 'Job positions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/job-positions/:id
 * @desc    Get job position by ID
 * @access  Private
 */
const getJobPositionById = async (req, res, next) => {
  try {
    const position = await JobPosition.findById(req.params.id)
      .populate('department', 'name code')
      .populate('employees', 'name email employeeId');

    if (!position) {
      return errorResponse(res, 'Job position not found', 404);
    }

    return successResponse(res, position, 'Job position retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/job-positions
 * @desc    Create a new job position
 * @access  Private (Admin, HR)
 */
const createJobPosition = async (req, res, next) => {
  try {
    const { name, department, description } = req.body;
    const position = await JobPosition.create({
      name,
      department,
      description
    });

    const populated = await JobPosition.findById(position._id).populate('department', 'name code');
    return successResponse(res, populated, 'Job position created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobPositions,
  getJobPositionById,
  createJobPosition
};
