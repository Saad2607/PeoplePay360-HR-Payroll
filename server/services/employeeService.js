const Employee = require('../models/Employee');

/**
 * Fetch all employees with optional filters and pagination
 */
const getEmployees = async (queryParams = {}) => {
  const {
    department,
    status,
    employeeType,
    search,
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc'
  } = queryParams;

  const filter = {};

  if (department) filter.department = department;
  if (status) filter.status = status;
  if (employeeType) filter.employeeType = employeeType;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
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
 * Fetch employee by ID with populated relations and virtuals
 */
const getEmployeeById = async (id) => {
  const employee = await Employee.findById(id)
    .populate('department')
    .populate('jobPosition')
    .populate('manager', 'name email employeeId')
    .populate('workingSchedule')
    .populate('activeContract')
    .populate('contracts')
    .populate('directReports', 'name email employeeId jobPosition');

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
 * Soft delete or remove an employee
 */
const deleteEmployee = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) {
    const error = new Error(`Employee not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  // Set status to Terminated
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
