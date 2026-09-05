const employeeService = require('../services/employeeService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/employees
 * @desc    Get all employees with filters and pagination
 * @access  Private (Admin, HR, Manager)
 */
const getAllEmployees = async (req, res, next) => {
  try {
    const { employees, total, page, limit } = await employeeService.getEmployees(req.query);
    return paginatedResponse(res, employees, page, limit, total, 'Employees retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID with full details
 * @access  Private
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    return successResponse(res, employee, 'Employee retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/employees
 * @desc    Create a new employee
 * @access  Private (Admin, HR)
 */
const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    return successResponse(res, employee, 'Employee created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee by ID
 * @access  Private (Admin, HR)
 */
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    return successResponse(res, employee, 'Employee updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete/terminate employee
 * @access  Private (Admin)
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.deleteEmployee(req.params.id);
    return successResponse(res, employee, 'Employee terminated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
