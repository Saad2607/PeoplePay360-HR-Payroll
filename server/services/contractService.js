const Contract = require('../models/Contract');
const Employee = require('../models/Employee');

/**
 * Check if a new or updated active contract overlaps with existing active contracts for the same employee
 * @param {string|ObjectId} employeeId
 * @param {Date|string} startDate
 * @param {Date|string|null} endDate
 * @param {string|ObjectId} [excludeContractId] - For update operations
 * @returns {Promise<Object|null>} Returns overlapping contract if found, otherwise null
 */
const checkContractOverlap = async (employeeId, startDate, endDate, excludeContractId = null) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const filter = {
    employee: employeeId,
    status: 'Active'
  };

  if (excludeContractId) {
    filter._id = { $ne: excludeContractId };
  }

  // Interval overlap logic:
  // Existing contract overlaps if:
  // (existing.startDate <= new.endDate OR new.endDate is null) AND
  // (existing.endDate is null OR existing.endDate >= new.startDate)
  const conditions = [];

  if (end) {
    conditions.push({ startDate: { $lte: end } });
  }

  conditions.push({
    $or: [
      { endDate: null },
      { endDate: { $gte: start } }
    ]
  });

  filter.$and = conditions;

  const overlappingContract = await Contract.findOne(filter);
  return overlappingContract;
};

/**
 * Fetch all contracts with optional filters and sorting
 */
const getContracts = async (queryParams = {}) => {
  const { status, department, employee, jobPosition, page = 1, limit = 50 } = queryParams;
  const filter = {};

  if (status) filter.status = status;
  if (department) filter.department = department;
  if (employee) filter.employee = employee;
  if (jobPosition) filter.jobPosition = jobPosition;

  const skip = (Number(page) - 1) * Number(limit);

  const [contracts, total] = await Promise.all([
    Contract.find(filter)
      .populate('employee', 'name email employeeId phone status')
      .populate('department', 'name code')
      .populate('jobPosition', 'name')
      .populate('workingSchedule', 'name type calculatedWeeklyHours')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Contract.countDocuments(filter)
  ]);

  return { contracts, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get single contract by ID
 */
const getContractById = async (id) => {
  const contract = await Contract.findById(id)
    .populate('employee', 'name email employeeId phone status department jobPosition')
    .populate('department', 'name code description')
    .populate('jobPosition', 'name description')
    .populate('workingSchedule');

  if (!contract) {
    const error = new Error(`Contract not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  return contract;
};

/**
 * Get all contracts for a specific employee (Historical and Active)
 */
const getContractsByEmployee = async (employeeId) => {
  const contracts = await Contract.find({ employee: employeeId })
    .populate('department', 'name code')
    .populate('jobPosition', 'name')
    .populate('workingSchedule', 'name type calculatedWeeklyHours')
    .sort({ startDate: -1 });

  return contracts;
};

/**
 * Get currently active contract for an employee
 */
const getActiveContract = async (employeeId) => {
  const contract = await Contract.findOne({
    employee: employeeId,
    status: 'Active'
  })
    .populate('department', 'name code')
    .populate('jobPosition', 'name')
    .populate('workingSchedule')
    .sort({ startDate: -1 });

  return contract;
};

/**
 * Create a new contract with overlap validation
 */
const createContract = async (contractData) => {
  const { employee, startDate, endDate, status = 'Active' } = contractData;

  // Enforce business rule: Prevent overlapping active contracts
  if (status === 'Active') {
    const overlapping = await checkContractOverlap(employee, startDate, endDate);
    if (overlapping) {
      const error = new Error(
        `Cannot create active contract. Overlaps with existing active contract '${overlapping.contractNumber}' (${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate ? overlapping.endDate.toISOString().split('T')[0] : 'Indefinite'}). Please terminate or expire the existing contract first.`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  const contract = await Contract.create(contractData);

  // Link as activeContract on Employee if status is Active
  if (contract.status === 'Active') {
    await Employee.findByIdAndUpdate(employee, {
      activeContract: contract._id
    });
  }

  return getContractById(contract._id);
};

/**
 * Update a contract with overlap validation
 */
const updateContract = async (id, updateData) => {
  const existingContract = await Contract.findById(id);
  if (!existingContract) {
    const error = new Error(`Contract not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const targetStatus = updateData.status !== undefined ? updateData.status : existingContract.status;
  const targetEmployee = updateData.employee || existingContract.employee;
  const targetStart = updateData.startDate || existingContract.startDate;
  const targetEnd = updateData.endDate !== undefined ? updateData.endDate : existingContract.endDate;

  if (targetStatus === 'Active') {
    const overlapping = await checkContractOverlap(targetEmployee, targetStart, targetEnd, id);
    if (overlapping) {
      const error = new Error(
        `Cannot activate/update contract. Overlaps with existing active contract '${overlapping.contractNumber}' (${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate ? overlapping.endDate.toISOString().split('T')[0] : 'Indefinite'}).`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  const contract = await Contract.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  // Maintain activeContract reference on Employee
  if (contract.status === 'Active') {
    await Employee.findByIdAndUpdate(contract.employee, {
      activeContract: contract._id
    });
  } else if (existingContract.status === 'Active' && contract.status !== 'Active') {
    // If was active and changed to something else, check if another active contract exists
    const latestActive = await Contract.findOne({
      employee: contract.employee,
      status: 'Active'
    }).sort({ startDate: -1 });

    await Employee.findByIdAndUpdate(contract.employee, {
      activeContract: latestActive ? latestActive._id : null
    });
  }

  return getContractById(contract._id);
};

/**
 * Delete a contract (Admin only)
 */
const deleteContract = async (id) => {
  const contract = await Contract.findById(id);
  if (!contract) {
    const error = new Error(`Contract not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  // If deleted contract is the employee's activeContract, clear or reassign
  const employee = await Employee.findById(contract.employee);
  if (employee && employee.activeContract && employee.activeContract.toString() === id) {
    const nextActive = await Contract.findOne({
      employee: contract.employee,
      _id: { $ne: id },
      status: 'Active'
    }).sort({ startDate: -1 });

    employee.activeContract = nextActive ? nextActive._id : null;
    await employee.save();
  }

  await Contract.findByIdAndDelete(id);
  return contract;
};

module.exports = {
  checkContractOverlap,
  getContracts,
  getContractById,
  getContractsByEmployee,
  getActiveContract,
  createContract,
  updateContract,
  deleteContract
};
