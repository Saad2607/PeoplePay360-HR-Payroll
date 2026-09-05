const Department = require('../models/Department');
const Employee = require('../models/Employee');
const JobPosition = require('../models/JobPosition');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/departments
 * @desc    Get all active departments with employee counts and job positions
 * @access  Private
 */
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('manager', 'name email employeeId')
      .populate('jobPositions', 'name description')
      .sort({ name: 1 })
      .lean();

    // Calculate dynamic employee counts for each department
    const employeeCounts = await Employee.aggregate([
      { $match: { status: { $ne: 'Terminated' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    employeeCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const enrichedDepartments = departments.map((dept) => ({
      ...dept,
      employeeCount: countMap[dept._id.toString()] || 0
    }));

    return successResponse(res, enrichedDepartments, 'Departments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID with manager, positions, and employee roster
 * @access  Private
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager', 'name email employeeId phone')
      .populate('jobPositions', 'name description')
      .populate({
        path: 'employees',
        match: { status: { $ne: 'Terminated' } },
        select: 'name email employeeId phone status employeeType jobPosition',
        populate: { path: 'jobPosition', select: 'name' }
      });

    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    const deptObj = department.toObject();
    deptObj.employeeCount = deptObj.employees ? deptObj.employees.length : 0;

    return successResponse(res, deptObj, 'Department details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/departments
 * @desc    Create a new department
 * @access  Private (HR Managers, Admin)
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, manager, description } = req.body;

    const department = await Department.create({
      name,
      code: code ? code.toUpperCase() : undefined,
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
 * @access  Private (HR Managers, Admin)
 */
const updateDepartment = async (req, res, next) => {
  try {
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }

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

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete or deactivate department (prevents deletion if employees exist)
 * @access  Private (Admin only)
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    // Safety rule: Prevent deletion if active employees are assigned
    const activeEmployeesCount = await Employee.countDocuments({
      department: req.params.id,
      status: { $ne: 'Terminated' }
    });

    if (activeEmployeesCount > 0) {
      return errorResponse(
        res,
        `Cannot delete department '${department.name}'. There are ${activeEmployeesCount} active employee(s) assigned to it. Reassign employees before deleting.`,
        400
      );
    }

    department.isActive = false;
    await department.save();

    return successResponse(res, department, 'Department deactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
