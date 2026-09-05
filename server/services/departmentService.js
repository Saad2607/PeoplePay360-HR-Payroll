const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const Employee = require('../models/Employee');

/**
 * Fetch all active departments with real-time employee counts
 */
const getDepartments = async () => {
  const departments = await Department.find({ isActive: true })
    .populate('manager', 'name email employeeId')
    .populate('jobPositions', 'name description')
    .sort({ name: 1 })
    .lean();

  const employeeCounts = await Employee.aggregate([
    { $match: { status: { $ne: 'Terminated' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);

  const countMap = {};
  employeeCounts.forEach((item) => {
    countMap[item._id.toString()] = item.count;
  });

  return departments.map((dept) => ({
    ...dept,
    employeeCount: countMap[dept._id.toString()] || 0
  }));
};

/**
 * Fetch department by ID
 */
const getDepartmentById = async (id) => {
  const department = await Department.findById(id)
    .populate('manager', 'name email employeeId phone')
    .populate('jobPositions', 'name description')
    .populate({
      path: 'employees',
      match: { status: { $ne: 'Terminated' } },
      select: 'name email employeeId phone status employeeType jobPosition',
      populate: { path: 'jobPosition', select: 'name' }
    });

  if (!department) {
    const error = new Error(`Department not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const deptObj = department.toObject();
  deptObj.employeeCount = deptObj.employees ? deptObj.employees.length : 0;
  return deptObj;
};

/**
 * Create a new department
 */
const createDepartment = async (departmentData) => {
  const { name, code, manager, description } = departmentData;

  const existing = await Department.findOne({
    $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }]
  });

  if (existing) {
    const error = new Error(`A department with name '${name}' or code '${code}' already exists.`);
    error.statusCode = 409;
    throw error;
  }

  if (manager) {
    const mgr = await Employee.findById(manager);
    if (!mgr) {
      const error = new Error(`Referenced manager with id '${manager}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
  }

  const department = await Department.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    manager: manager || null,
    description
  });

  return department;
};

/**
 * Update department
 */
const updateDepartment = async (id, updateData) => {
  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();
  }

  if (updateData.manager) {
    const mgr = await Employee.findById(updateData.manager);
    if (!mgr) {
      const error = new Error(`Referenced manager with id '${updateData.manager}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
  }

  const department = await Department.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('manager', 'name email employeeId');

  if (!department) {
    const error = new Error(`Department not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  return department;
};

/**
 * Delete department safely
 */
const deleteDepartment = async (id) => {
  const department = await Department.findById(id);
  if (!department) {
    const error = new Error(`Department not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const activeEmployeesCount = await Employee.countDocuments({
    department: id,
    status: { $ne: 'Terminated' }
  });

  if (activeEmployeesCount > 0) {
    const error = new Error(
      `Cannot delete department '${department.name}'. There are ${activeEmployeesCount} active employee(s) assigned to it.`
    );
    error.statusCode = 400;
    throw error;
  }

  department.isActive = false;
  await department.save();
  return department;
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
