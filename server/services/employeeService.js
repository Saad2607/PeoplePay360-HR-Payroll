const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const WorkingSchedule = require('../models/WorkingSchedule');
const Contract = require('../models/Contract');
const { ROLES } = require('../config/roles');

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

  // Conditionally populate Krish's future models if registered
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
 * Validate that referenced entities exist in the database before linking
 */
const validateEmployeeReferences = async (data, existingEmployeeId = null) => {
  const { department, jobPosition, workingSchedule, manager, employeeId, email } = data;

  // 1. Check duplicate employeeId or email
  if (employeeId) {
    const query = { employeeId: employeeId.toUpperCase() };
    if (existingEmployeeId) query._id = { $ne: existingEmployeeId };
    const duplicateId = await Employee.findOne(query);
    if (duplicateId) {
      const error = new Error(`An employee with ID '${employeeId.toUpperCase()}' already exists.`);
      error.statusCode = 409;
      throw error;
    }
  }

  if (email) {
    const query = { email: email.toLowerCase() };
    if (existingEmployeeId) query._id = { $ne: existingEmployeeId };
    const duplicateEmail = await Employee.findOne(query);
    if (duplicateEmail) {
      const error = new Error(`An employee with email '${email.toLowerCase()}' already exists.`);
      error.statusCode = 409;
      throw error;
    }
  }

  // 2. Validate Department existence
  if (department) {
    const dept = await Department.findById(department);
    if (!dept) {
      const error = new Error(`Referenced Department with id '${department}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Validate JobPosition existence & department alignment
  if (jobPosition) {
    const pos = await JobPosition.findById(jobPosition);
    if (!pos) {
      const error = new Error(`Referenced Job Position with id '${jobPosition}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
    if (department && pos.department.toString() !== department.toString()) {
      const error = new Error(
        `Job Position '${pos.name}' belongs to department ID '${pos.department}', not '${department}'.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Validate WorkingSchedule existence
  if (workingSchedule) {
    const sched = await WorkingSchedule.findById(workingSchedule);
    if (!sched) {
      const error = new Error(`Referenced Working Schedule with id '${workingSchedule}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Validate Manager existence & non-circularity
  if (manager) {
    if (existingEmployeeId && manager.toString() === existingEmployeeId.toString()) {
      const error = new Error('An employee cannot be assigned as their own manager.');
      error.statusCode = 400;
      throw error;
    }
    const mgr = await Employee.findById(manager);
    if (!mgr) {
      const error = new Error(`Referenced Manager with id '${manager}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
  }
};

/**
 * Create a new employee record with database relationship validation
 */
const createEmployee = async (employeeData) => {
  // Validate database integrity of all references
  await validateEmployeeReferences(employeeData);

  const employee = await Employee.create(employeeData);
  return getEmployeeById(employee._id);
};

/**
 * Update an existing employee record with reference checks and active contract sync
 */
const updateEmployee = async (id, updateData) => {
  const existingEmployee = await Employee.findById(id);
  if (!existingEmployee) {
    const error = new Error(`Employee not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  // Validate updated references
  await validateEmployeeReferences(updateData, id);

  // If status is being set to Terminated, sync active contract
  if (updateData.status === 'Terminated' && existingEmployee.activeContract) {
    await Contract.findByIdAndUpdate(existingEmployee.activeContract, {
      status: 'Terminated',
      notes: (existingEmployee.notes || '') + ' [Auto-terminated due to employee departure]'
    });
    updateData.activeContract = null;
  }

  const employee = await Employee.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('department')
    .populate('jobPosition')
    .populate('workingSchedule')
    .populate('activeContract');

  return employee;
};

/**
 * Safe termination of an employee (preserves contracts and historical audit trails)
 */
const deleteEmployee = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) {
    const error = new Error(`Employee not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  // Soft delete: set status to Terminated
  employee.status = 'Terminated';

  // Mark active contract as Terminated if one exists
  if (employee.activeContract) {
    await Contract.findByIdAndUpdate(employee.activeContract, {
      status: 'Terminated'
    });
    employee.activeContract = null;
  }

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
