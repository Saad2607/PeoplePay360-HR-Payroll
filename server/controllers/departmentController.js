const Department = require('../models/Department');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Private
 */
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('manager', 'name email employeeId')
      .populate('jobPositions')
      .sort({ name: 1 });

    return successResponse(res, departments, 'Departments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  Private
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager', 'name email employeeId')
      .populate('jobPositions')
      .populate('employees', 'name email employeeId jobPosition');

    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    return successResponse(res, department, 'Department details retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/departments
 * @desc    Create a new department
 * @access  Private (Admin, HR)
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, manager, description } = req.body;
    const department = await Department.create({
      name,
      code,
      manager: manager || null,
      description
    });

    return successResponse(res, department, 'Department created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private (Admin, HR)
 */
const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('manager', 'name email employeeId');

    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    return successResponse(res, department, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment
};
