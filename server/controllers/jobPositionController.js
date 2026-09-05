const JobPosition = require('../models/JobPosition');
const Employee = require('../models/Employee');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/job-positions
 * @desc    Get all active job positions (optionally filter by department) with employee count
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
      .sort({ name: 1 })
      .lean();

    // Aggregate employee counts per job position
    const employeeCounts = await Employee.aggregate([
      { $match: { status: { $ne: 'Terminated' } } },
      { $group: { _id: '$jobPosition', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    employeeCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const enrichedPositions = positions.map((pos) => ({
      ...pos,
      employeeCount: countMap[pos._id.toString()] || 0
    }));

    return successResponse(res, enrichedPositions, 'Job positions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/job-positions/:id
 * @desc    Get job position by ID with employee list
 * @access  Private
 */
const getJobPositionById = async (req, res, next) => {
  try {
    const position = await JobPosition.findById(req.params.id)
      .populate('department', 'name code description')
      .populate({
        path: 'employees',
        match: { status: { $ne: 'Terminated' } },
        select: 'name email employeeId phone status employeeType'
      });

    if (!position) {
      return errorResponse(res, 'Job position not found', 404);
    }

    const posObj = position.toObject();
    posObj.employeeCount = posObj.employees ? posObj.employees.length : 0;

    return successResponse(res, posObj, 'Job position retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/job-positions
 * @desc    Create a new job position
 * @access  Private (HR Managers, Admin)
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

/**
 * @route   PUT /api/job-positions/:id
 * @desc    Update a job position
 * @access  Private (HR Managers, Admin)
 */
const updateJobPosition = async (req, res, next) => {
  try {
    const position = await JobPosition.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('department', 'name code');

    if (!position) {
      return errorResponse(res, 'Job position not found', 404);
    }

    return successResponse(res, position, 'Job position updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/job-positions/:id
 * @desc    Delete or deactivate a job position
 * @access  Private (Admin only)
 */
const deleteJobPosition = async (req, res, next) => {
  try {
    const position = await JobPosition.findById(req.params.id);
    if (!position) {
      return errorResponse(res, 'Job position not found', 404);
    }

    const activeCount = await Employee.countDocuments({
      jobPosition: req.params.id,
      status: { $ne: 'Terminated' }
    });

    if (activeCount > 0) {
      return errorResponse(
        res,
        `Cannot delete job position '${position.name}'. ${activeCount} active employee(s) currently hold this position.`,
        400
      );
    }

    position.isActive = false;
    await position.save();

    return successResponse(res, position, 'Job position deactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobPositions,
  getJobPositionById,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition
};
