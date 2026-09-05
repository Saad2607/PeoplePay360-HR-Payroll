const Payrun = require('../models/Payrun');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const SalaryStructure = require('../models/SalaryStructure');

/**
 * Step 2 of Payrun Wizard: Filter eligible employees for a given salary structure and period.
 * Does NOT create a Payrun in the database.
 */
const getEligibleEmployees = async ({ salaryStructureId, period }) => {
  const structure = await SalaryStructure.findById(salaryStructureId);
  if (!structure) {
    const error = new Error('Salary structure not found.');
    error.statusCode = 404;
    throw error;
  }

  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);

  if (periodEnd < periodStart) {
    const error = new Error('Period endDate cannot precede startDate.');
    error.statusCode = 400;
    throw error;
  }

  // Fetch all active employees
  const employees = await Employee.find({ status: 'Active' })
    .populate('department', 'name code')
    .populate('jobPosition', 'name')
    .populate('workingSchedule', 'name');

  const eligibleEmployees = [];
  const ineligibleEmployees = [];

  for (const emp of employees) {
    // 1. Find applicable contract for this period
    const applicableContract = await Contract.findOne({
      employee: emp._id,
      status: { $in: ['Active', 'Expired'] },
      startDate: { $lte: periodEnd },
      $or: [
        { endDate: null },
        { endDate: { $gte: periodStart } }
      ]
    }).sort({ startDate: -1 });

    if (!applicableContract) {
      ineligibleEmployees.push({
        employee: emp,
        reason: 'No applicable contract active during this payroll period'
      });
      continue;
    }

    // 2. Check duplicate payslip in an existing non-cancelled payrun
    const overlappingPayrun = await Payrun.findOne({
      selectedEmployees: emp._id,
      status: { $in: ['Computed', 'Validated', 'Paid'] },
      'period.startDate': { $lte: periodEnd },
      'period.endDate': { $gte: periodStart }
    });

    if (overlappingPayrun) {
      ineligibleEmployees.push({
        employee: emp,
        contract: applicableContract,
        reason: `Employee is already included in active payrun '${overlappingPayrun.name}' for this period`
      });
      continue;
    }

    // Warnings (non-blocking)
    const warnings = [];
    if (!emp.phone) {
      warnings.push('Missing contact phone number');
    }

    eligibleEmployees.push({
      employee: {
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        jobPosition: emp.jobPosition
      },
      contract: {
        _id: applicableContract._id,
        contractNumber: applicableContract.contractNumber,
        wage: applicableContract.wage,
        wageType: applicableContract.wageType
      },
      warnings
    });
  }

  return {
    salaryStructure: {
      _id: structure._id,
      name: structure.name
    },
    period: {
      startDate: periodStart,
      endDate: periodEnd
    },
    eligibleEmployees,
    ineligibleEmployees,
    totalEligible: eligibleEmployees.length,
    totalIneligible: ineligibleEmployees.length
  };
};

/**
 * Step 3 of Payrun Wizard: Create Payrun once employee selection is confirmed.
 */
const createPayrun = async ({ name, salaryStructureId, period, selectedEmployees, notes, user }) => {
  const structure = await SalaryStructure.findById(salaryStructureId);
  if (!structure) {
    const error = new Error('Salary structure not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!selectedEmployees || selectedEmployees.length === 0) {
    const error = new Error('At least one employee must be selected to create a payrun.');
    error.statusCode = 400;
    throw error;
  }

  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);

  if (periodEnd < periodStart) {
    const error = new Error('Period endDate cannot precede startDate.');
    error.statusCode = 400;
    throw error;
  }

  const payrun = await Payrun.create({
    name,
    salaryStructure: salaryStructureId,
    period: {
      startDate: periodStart,
      endDate: periodEnd
    },
    selectedEmployees,
    status: 'Draft',
    notes: notes || '',
    createdBy: user?._id || null
  });

  return Payrun.findById(payrun._id)
    .populate('salaryStructure', 'name description')
    .populate('selectedEmployees', 'name email employeeId department jobPosition')
    .populate('createdBy', 'name email role');
};

/**
 * Get all payruns with filtering
 */
const getPayruns = async (queryParams) => {
  const { status, year, page = 1, limit = 10 } = queryParams;
  const filter = {};

  if (status) filter.status = status;
  if (year) {
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);
    filter['period.startDate'] = { $gte: start, $lte: end };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Payrun.countDocuments(filter);

  const payruns = await Payrun.find(filter)
    .populate('salaryStructure', 'name')
    .populate('selectedEmployees', 'name email employeeId')
    .populate('createdBy', 'name email')
    .sort({ 'period.startDate': -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return { payruns, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get single payrun by ID with full details
 */
const getPayrunById = async (id) => {
  const payrun = await Payrun.findById(id)
    .populate('salaryStructure')
    .populate('selectedEmployees', 'name email employeeId department jobPosition')
    .populate('payslips')
    .populate('createdBy', 'name email role')
    .populate('validation.validatedBy', 'name email')
    .populate('payment.paidBy', 'name email');

  if (!payrun) {
    const error = new Error('Payrun not found.');
    error.statusCode = 404;
    throw error;
  }

  return payrun;
};

/**
 * Delete a Draft payrun
 */
const deletePayrun = async (id) => {
  const payrun = await Payrun.findById(id);
  if (!payrun) {
    const error = new Error('Payrun not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payrun.status !== 'Draft') {
    const error = new Error(`Cannot delete payrun with status '${payrun.status}'. Only Draft payruns can be deleted.`);
    error.statusCode = 400;
    throw error;
  }

  await Payrun.findByIdAndDelete(id);
  return { message: 'Payrun deleted successfully' };
};

module.exports = {
  getEligibleEmployees,
  createPayrun,
  getPayruns,
  getPayrunById,
  deletePayrun
};
