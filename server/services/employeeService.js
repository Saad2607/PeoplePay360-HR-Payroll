const Employee = require('../models/Employee');
const { ROLES } = require('../config/roles');
const mongoose = require('mongoose');

/**
 * Fetch employees with optional filters, search, and pagination.
 * If requesting user is Employee role, restricts results to their own record.
 */
const getEmployees = async (queryParams = {}, requestingUser = null) => {
  const {
    department,
    jobPosition,
    status,
    employeeType,
    search,
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc'
  } = queryParams;

  const filter = {};

  // Role-based boundary: Standard employees can only query their own record
  if (requestingUser && requestingUser.role === ROLES.EMPLOYEE) {
    const userEmpId = requestingUser.employee?._id || requestingUser.employee;
    if (!userEmpId) {
      return { employees: [], total: 0, page: Number(page), limit: Number(limit) };
    }
    filter._id = userEmpId;
  } else {
    // Privileged roles can filter across all fields
    if (department) filter.department = department;
    if (jobPosition) filter.jobPosition = jobPosition;
    if (status) filter.status = status;
    if (employeeType) filter.employeeType = employeeType;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('department', 'name code')
      .populate('jobPosition', 'name')
      .populate('manager', 'name email employeeId')
      .populate('workingSchedule', 'name type calculatedWeeklyHours')
      .populate('activeContract', 'contractNumber wage wageType status')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Employee.countDocuments(filter)
  ]);

  return { employees, total, page: Number(page), limit: Number(limit) };
};

/**
 * Fetch employee by ID with fully populated relational links & virtuals
 */
const getEmployeeById = async (id) => {
  let query = Employee.findById(id)
    .populate('department')
    .populate('jobPosition')
    .populate('manager', 'name email employeeId')
    .populate('workingSchedule')
    .populate('activeContract')
    .populate('contracts')
    .populate('directReports', 'name email employeeId jobPosition');

  // Conditionally populate Krish's future models if they have been registered in mongoose
  if (mongoose.models.Attendance) {
    query = query.populate('attendances');
  }
  if (mongoose.models.TimeOff) {
    query = query.populate('timeOffRequests');
  }
  if (mongoose.models.LeaveAllocation) {
    query = query.populate('allocations');
  }

  const employee = await query.exec();

  if (!employee) {
    const error = new Error(`Employee not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

/**
 * Create a new employee record
 */
const createEmployee = async (employeeData) => {
  const employee = await Employee.create(employeeData);
  return getEmployeeById(employee._id);
};

/**
 * Update an existing employee record
 */
const updateEmployee = async (id, updateData) => {
  const employee = await Employee.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('department')
    .populate('jobPosition')
    .populate('workingSchedule')
    .populate('activeContract');

  if (!employee) {
    const error = new Error(`Employee not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

/**
 * Terminate/remove an employee (Admin only)
 */
const deleteEmployee = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) {
    const error = new Error(`Employee not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  // Soft delete: update status to Terminated
  employee.status = 'Terminated';
  await employee.save();
  return employee;
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
