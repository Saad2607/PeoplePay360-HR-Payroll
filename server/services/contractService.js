const Contract = require('../models/Contract');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const WorkingSchedule = require('../models/WorkingSchedule');

/**
 * Validate that referenced entities exist in the database before creating or updating contracts
 */
const validateContractReferences = async (data, excludeContractId = null) => {
  const { employee, department, jobPosition, workingSchedule, contractNumber } = data;

  // 1. Contract number uniqueness
  if (contractNumber) {
    const query = { contractNumber: contractNumber.toUpperCase() };
    if (excludeContractId) query._id = { $ne: excludeContractId };
    const duplicate = await Contract.findOne(query);
    if (duplicate) {
      const error = new Error(`A contract with number '${contractNumber.toUpperCase()}' already exists.`);
      error.statusCode = 409;
      throw error;
    }
  }

  // 2. Validate Employee existence
  if (employee) {
    const emp = await Employee.findById(employee);
    if (!emp) {
      const error = new Error(`Referenced Employee with id '${employee}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Validate Department existence
  if (department) {
    const dept = await Department.findById(department);
    if (!dept) {
      const error = new Error(`Referenced Department with id '${department}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Validate JobPosition existence & department match
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

  // 5. Validate WorkingSchedule existence if provided
  if (workingSchedule) {
    const sched = await WorkingSchedule.findById(workingSchedule);
    if (!sched) {
      const error = new Error(`Referenced Working Schedule with id '${workingSchedule}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
  }
};

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

  // Validate relational integrity of foreign keys
  await validateContractReferences(contractData);

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

  // Validate relational integrity of updated references
  await validateContractReferences(updateData, id);

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

/**
 * CRITICAL BUSINESS RULE:
 * Retrieve the specific contract applicable to a designated payroll period.
 *
 * Payroll must NOT simply use the employee's latest contract, because historical payruns,
 * salary revisions, and multi-contract employees require the exact contract in force
 * during the payroll period interval.
 *
 * @param {string|ObjectId} employeeId - Target employee ObjectId or ID string
 * @param {Object|string|Date} payrollPeriod - { startDate, endDate } or single date
 * @returns {Promise<Object>} Applicable contract document populated with details
 */
const getApplicableContract = async (employeeId, payrollPeriod) => {
  if (!employeeId) {
    const error = new Error('employeeId is required to find an applicable contract.');
    error.statusCode = 400;
    throw error;
  }

  if (!payrollPeriod) {
    const error = new Error('payrollPeriod is required (provide startDate and endDate).');
    error.statusCode = 400;
    throw error;
  }

  let periodStart;
  let periodEnd;

  if (typeof payrollPeriod === 'string' || payrollPeriod instanceof Date) {
    periodStart = new Date(payrollPeriod);
    periodEnd = new Date(payrollPeriod);
  } else if (typeof payrollPeriod === 'object') {
    const startVal = payrollPeriod.startDate || payrollPeriod.from || payrollPeriod.start;
    const endVal = payrollPeriod.endDate || payrollPeriod.to || payrollPeriod.end || startVal;

    if (!startVal) {
      const error = new Error('payrollPeriod must have a valid startDate.');
      error.statusCode = 400;
      throw error;
    }

    periodStart = new Date(startVal);
    periodEnd = new Date(endVal);
  }

  if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
    const error = new Error('Invalid date format provided for payrollPeriod.');
    error.statusCode = 400;
    throw error;
  }

  // Normalize period to start and end of respective calendar days
  periodStart.setHours(0, 0, 0, 0);
  periodEnd.setHours(23, 59, 59, 999);

  // Find candidate contracts:
  // 1. Belong to target employee
  // 2. Not Draft or Terminated (Active or Expired historical contracts)
  // 3. Contract started on or before periodEnd
  // 4. Contract has not ended before periodStart
  const candidateContracts = await Contract.find({
    employee: employeeId,
    status: { $in: ['Active', 'Expired'] },
    startDate: { $lte: periodEnd },
    $or: [
      { endDate: null },
      { endDate: { $gte: periodStart } }
    ]
  })
    .populate('department', 'name code')
    .populate('jobPosition', 'name')
    .populate('workingSchedule')
    .sort({ startDate: -1 });

  if (!candidateContracts || candidateContracts.length === 0) {
    const startStr = periodStart.toISOString().split('T')[0];
    const endStr = periodEnd.toISOString().split('T')[0];
    const error = new Error(
      `No applicable contract found for employee ${employeeId} during payroll period ${startStr} to ${endStr}.`
    );
    error.statusCode = 404;
    throw error;
  }

  // If single candidate contract, return it immediately
  if (candidateContracts.length === 1) {
    return candidateContracts[0];
  }

  // If multiple contracts span this period, pick the contract with maximum day coverage
  let bestContract = candidateContracts[0];
  let maxOverlapMs = 0;

  for (const contract of candidateContracts) {
    const effectiveStart = Math.max(contract.startDate.getTime(), periodStart.getTime());
    const contractEndTime = contract.endDate ? contract.endDate.getTime() : periodEnd.getTime();
    const effectiveEnd = Math.min(contractEndTime, periodEnd.getTime());

    const overlapMs = Math.max(0, effectiveEnd - effectiveStart);
    if (overlapMs > maxOverlapMs) {
      maxOverlapMs = overlapMs;
      bestContract = contract;
    } else if (overlapMs === maxOverlapMs) {
      // Tie-breaker: choose more recent contract start date
      if (contract.startDate.getTime() > bestContract.startDate.getTime()) {
        bestContract = contract;
      }
    }
  }

  return bestContract;
};

module.exports = {
  checkContractOverlap,
  getContracts,
  getContractById,
  getContractsByEmployee,
  getActiveContract,
  getApplicableContract,
  createContract,
  updateContract,
  deleteContract
};
