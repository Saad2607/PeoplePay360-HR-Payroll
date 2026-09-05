const Payrun = require('../models/Payrun');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const SalaryStructure = require('../models/SalaryStructure');
const Payslip = require('../models/Payslip');
const payrollService = require('./payrollService');
const payrollValidatorService = require('./payrollValidatorService');
const emailService = require('./emailService');

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

/**
 * Compute Payrun: Generate and store payslips for all selected employees using payrollService.calculatePayslip.
 * Does NOT duplicate calculation logic.
 */
const computePayrun = async (payrunId, user) => {
  const payrun = await Payrun.findById(payrunId).populate('salaryStructure');
  if (!payrun) {
    const error = new Error('Payrun not found.');
    error.statusCode = 404;
    throw error;
  }

  if (['Validated', 'Paid'].includes(payrun.status)) {
    const error = new Error(`Cannot re-compute a payrun that is already in '${payrun.status}' status.`);
    error.statusCode = 400;
    throw error;
  }

  const payslipIds = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  for (const empId of payrun.selectedEmployees) {
    // Call existing calculatePayslip service
    const calcResult = await payrollService.calculatePayslip({
      employee: empId,
      period: payrun.period,
      salaryStructure: payrun.salaryStructure
    });

    const startYear = payrun.period.startDate.getFullYear();
    const startMonth = String(payrun.period.startDate.getMonth() + 1).padStart(2, '0');
    const payslipNumber = `PAY-${startYear}${startMonth}-${calcResult.employee.employeeId || empId.toString().slice(-6).toUpperCase()}`;

    // Extract basic, allowances, deductions
    const basicAmount = calcResult.earnings.find((e) => e.code === 'BASIC')?.amount || 0;
    const allowancesAmount = calcResult.earnings
      .filter((e) => e.code !== 'BASIC')
      .reduce((sum, e) => sum + e.amount, 0);
    const deductionsAmount = calcResult.totalDeductions;

    // Upsert or create Payslip
    let payslip = await Payslip.findOne({ payrun: payrun._id, employee: empId });
    if (!payslip) {
      payslip = new Payslip({
        payslipNumber,
        employee: empId,
        payrun: payrun._id
      });
    }

    payslip.salaryStructure = payrun.salaryStructure._id;
    payslip.contract = calcResult.contract._id;
    payslip.period = payrun.period;
    payslip.workedDays = calcResult.attendanceSummary?.presentDays || 0;
    payslip.basic = basicAmount;
    payslip.allowances = allowancesAmount;
    payslip.deductions = deductionsAmount;
    payslip.gross = calcResult.grossSalary;
    payslip.net = calcResult.netSalary;
    payslip.status = 'Computed';
    payslip.salaryBreakdown = calcResult.ruleBreakdown;
    payslip.attendanceSummary = calcResult.attendanceSummary;
    payslip.timeOffSummary = calcResult.timeOffSummary;

    await payslip.save();
    payslipIds.push(payslip._id);

    totalGross += payslip.gross;
    totalDeductions += payslip.deductions;
    totalNet += payslip.net;
  }

  payrun.payslips = payslipIds;
  payrun.totalGross = Math.round(totalGross * 100) / 100;
  payrun.totalDeductions = Math.round(totalDeductions * 100) / 100;
  payrun.totalNet = Math.round(totalNet * 100) / 100;
  payrun.status = 'Computed';

  await payrun.save();

  return Payrun.findById(payrun._id)
    .populate('salaryStructure', 'name')
    .populate('selectedEmployees', 'name email employeeId department jobPosition')
    .populate('payslips');
};

/**
 * Get all payslips with filtering & role permission checks
 */
const getPayslips = async (queryParams, user) => {
  const { employee, payrun, status, page = 1, limit = 10 } = queryParams;
  const filter = {};

  if (user.role === 'Employee') {
    const empId = user.employee?._id || user.employee;
    filter.employee = empId;
  } else if (employee) {
    filter.employee = employee;
  }

  if (payrun) filter.payrun = payrun;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Payslip.countDocuments(filter);

  const payslips = await Payslip.find(filter)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate('payrun', 'name period status')
    .populate('salaryStructure', 'name')
    .populate('contract', 'contractNumber wage')
    .sort({ 'period.startDate': -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return { payslips, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get single payslip by ID
 */
const getPayslipById = async (id, user) => {
  const payslip = await Payslip.findById(id)
    .populate({
      path: 'employee',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'jobPosition', select: 'name' }
      ]
    })
    .populate('payrun', 'name period status payment')
    .populate('salaryStructure', 'name')
    .populate('contract');

  if (!payslip) {
    const error = new Error('Payslip not found.');
    error.statusCode = 404;
    throw error;
  }

  // Employee self-authorization check
  if (user.role === 'Employee') {
    const userEmpId = (user.employee?._id || user.employee).toString();
    if (payslip.employee._id.toString() !== userEmpId) {
      const error = new Error('Forbidden: You can only view your own payslip.');
      error.statusCode = 403;
      throw error;
    }
  }

  return payslip;
};

/**
 * Validate Payrun: Runs the full payroll validation engine.
 * If valid, updates payrun and its payslips to 'Validated' status.
 * If invalid, saves error breakdown on payrun and throws an informative 422 error.
 */
const validatePayrun = async (payrunId, user) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const error = new Error('Payrun not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payrun.status === 'Draft') {
    const error = new Error('Payrun must be computed before it can be validated. Please compute the payrun first.');
    error.statusCode = 400;
    throw error;
  }

  if (payrun.status === 'Paid') {
    const error = new Error('Payrun has already been paid and cannot be re-validated.');
    error.statusCode = 400;
    throw error;
  }

  // Execute Payroll Validation Engine
  const validationResult = await payrollValidatorService.validatePayrun(payrunId);

  payrun.validation = {
    isValid: validationResult.isValid,
    validatedAt: validationResult.isValid ? new Date() : null,
    validatedBy: validationResult.isValid ? (user?._id || null) : null,
    errors: validationResult.errors,
    warnings: validationResult.warnings
  };

  if (!validationResult.isValid) {
    await payrun.save();
    const error = new Error(`Payroll validation failed with ${validationResult.errors.length} error(s). Ensure all issues are resolved before validating.`);
    error.statusCode = 422;
    error.errors = validationResult.errors;
    error.warnings = validationResult.warnings;
    throw error;
  }

  // Validation passed: update status to Validated
  payrun.status = 'Validated';
  await payrun.save();

  // Update all linked payslips to Validated
  await Payslip.updateMany(
    { payrun: payrun._id },
    { $set: { status: 'Validated' } }
  );

  return Payrun.findById(payrun._id)
    .populate('salaryStructure', 'name')
    .populate('selectedEmployees', 'name email employeeId department jobPosition')
    .populate('payslips')
    .populate('validation.validatedBy', 'name email');
};

/**
 * Read-only inspection of payrun validation status
 */
const checkPayrunValidation = async (payrunId) => {
  return payrollValidatorService.validatePayrun(payrunId);
};

/**
 * Mark Payrun as Paid: requires payrun to be in 'Validated' status.
 * Updates payrun and all linked payslips to 'Paid'.
 */
const markPaid = async (payrunId, paymentData = {}, user) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const error = new Error('Payrun not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payrun.status !== 'Validated') {
    const error = new Error(`Cannot mark payrun as Paid. Current status is '${payrun.status}'. Payrun must be in 'Validated' status first.`);
    error.statusCode = 400;
    throw error;
  }

  const { paymentMethod = 'Bank Transfer', reference = '' } = paymentData;

  payrun.status = 'Paid';
  payrun.payment = {
    paidAt: new Date(),
    paidBy: user?._id || null,
    paymentMethod,
    reference
  };

  await payrun.save();

  // Update all linked payslips to Paid
  await Payslip.updateMany(
    { payrun: payrun._id },
    { $set: { status: 'Paid' } }
  );

  return Payrun.findById(payrun._id)
    .populate('salaryStructure', 'name')
    .populate('selectedEmployees', 'name email employeeId department jobPosition')
    .populate('payslips')
    .populate('validation.validatedBy', 'name email')
    .populate('payment.paidBy', 'name email');
};

/**
 * Bulk send payslips to employees via email with generated PDF attachments.
 * Gracefully logs delivery statuses and tracks email status on payslips.
 */
const sendPayslips = async (payrunId, user) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const error = new Error('Payrun not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payrun.status === 'Draft') {
    const error = new Error('Payrun must be computed and validated before sending payslips.');
    error.statusCode = 400;
    throw error;
  }

  // Fetch all payslips populated with employee, department, jobPosition, contract, and payrun
  const payslips = await Payslip.find({ payrun: payrun._id })
    .populate({
      path: 'employee',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'jobPosition', select: 'name' }
      ]
    })
    .populate('contract')
    .populate('salaryStructure')
    .populate('payrun');

  if (!payslips || payslips.length === 0) {
    const error = new Error('No payslips found for this payrun to send.');
    error.statusCode = 404;
    throw error;
  }

  const deliveryReport = await emailService.sendBulkPayslips(payslips, { attachPdf: true });

  return {
    payrun: {
      _id: payrun._id,
      name: payrun.name,
      status: payrun.status,
      period: payrun.period
    },
    ...deliveryReport
  };
};

module.exports = {
  getEligibleEmployees,
  createPayrun,
  getPayruns,
  getPayrunById,
  deletePayrun,
  computePayrun,
  validatePayrun,
  checkPayrunValidation,
  markPaid,
  sendPayslips,
  getPayslips,
  getPayslipById
};

