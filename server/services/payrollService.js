const Contract = require('../models/Contract');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const SalaryRule = require('../models/SalaryRule');
const Attendance = require('../models/Attendance');
const TimeOffRequest = require('../models/TimeOffRequest');

/**
 * Safely evaluates a mathematical formula against context variables
 * Supports rule codes (BASIC, HRA, GROSS, etc.), numbers, standard operators (+, -, *, /, %),
 * parentheses, and safe Math functions (min, max, round, ceil, floor).
 */
const evaluateFormula = (formulaStr, context) => {
  if (!formulaStr || typeof formulaStr !== 'string') {
    return 0;
  }

  let expr = formulaStr.trim();

  // Replace dotted paths first (e.g. contract.wage, attendance.overtimeHours)
  expr = expr.replace(/contract\.salaryStructure\.basic/g, String(context.contract?.salaryStructure?.basic || 0));
  expr = expr.replace(/contract\.wage/g, String(context.contract?.wage || 0));
  expr = expr.replace(/attendance\.workedHours/g, String(context.attendance?.workedHours || 0));
  expr = expr.replace(/attendance\.overtimeHours/g, String(context.attendance?.overtimeHours || 0));
  expr = expr.replace(/attendance\.presentDays/g, String(context.attendance?.presentDays || 0));
  expr = expr.replace(/timeOff\.unpaidDays/g, String(context.timeOff?.unpaidDays || 0));
  expr = expr.replace(/timeOff\.paidDays/g, String(context.timeOff?.paidDays || 0));

  // Replace variable codes in context (e.g. BASIC, HRA, TRANSPORT, GROSS, DEDUCTION)
  // Sort keys by length descending to prevent partial prefix replacement (e.g. GROSS vs GROSS_EXTRA)
  const keys = Object.keys(context)
    .filter((k) => typeof context[k] === 'number')
    .sort((a, b) => b.length - a.length);

  for (const key of keys) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    expr = expr.replace(regex, String(context[key] || 0));
  }

  // Sanitize expression: only allow numbers, math operators, parens, spaces, Math.methods
  const sanitized = expr.replace(/Math\.(min|max|round|ceil|floor|abs)/g, '');
  if (/[^0-9+\-*/%().\s]/.test(sanitized)) {
    throw new Error(`Formula contains invalid or unresolvable tokens: '${expr}' in formula '${formulaStr}'`);
  }

  try {
    // Evaluates strictly pure arithmetic expression
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${expr});`)();
    const num = Number(result);
    return isNaN(num) || !isFinite(num) ? 0 : Math.round(num * 100) / 100;
  } catch (err) {
    throw new Error(`Failed to evaluate formula '${formulaStr}' [parsed as '${expr}']: ${err.message}`);
  }
};

/**
 * Find the applicable contract for an employee during a given payroll period.
 * Does NOT simply use the employee's latest salary.
 * Accurately selects contract valid during the pay period dates.
 */
const findApplicableContract = async (employeeId, period) => {
  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);

  if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
    const error = new Error('Invalid period startDate or endDate format.');
    error.statusCode = 400;
    throw error;
  }

  if (periodEnd < periodStart) {
    const error = new Error('Period endDate cannot precede startDate.');
    error.statusCode = 400;
    throw error;
  }

  // Find contract that was active during this period:
  // 1. startDate must be on or before periodEnd
  // 2. endDate must be null or on/after periodStart
  // 3. status is Active or Expired (historical contracts active at that time)
  const contract = await Contract.findOne({
    employee: employeeId,
    status: { $in: ['Active', 'Expired'] },
    startDate: { $lte: periodEnd },
    $or: [
      { endDate: null },
      { endDate: { $gte: periodStart } }
    ]
  })
    .sort({ startDate: -1 })
    .populate('department', 'name code')
    .populate('jobPosition', 'name');

  if (!contract) {
    const error = new Error(
      `No applicable employment contract found for employee for the pay period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}.`
    );
    error.statusCode = 404;
    throw error;
  }

  return contract;
};

/**
 * Summarize attendance records for employee within pay period
 */
const getPeriodAttendanceSummary = async (employeeId, period) => {
  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);
  periodEnd.setHours(23, 59, 59, 999);

  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: periodStart, $lte: periodEnd }
  });

  const presentRecords = records.filter((r) => r.status === 'Present' || r.status === 'Late' || r.workedHours > 0);
  const totalWorkedHours = records.reduce((sum, r) => sum + (r.workedHours || 0), 0);
  const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

  return {
    totalRecords: records.length,
    presentDays: presentRecords.length,
    workedHours: Math.round(totalWorkedHours * 100) / 100,
    overtimeHours: Math.round(totalOvertimeHours * 100) / 100
  };
};

/**
 * Summarize approved time off for employee within pay period
 */
const getPeriodTimeOffSummary = async (employeeId, period) => {
  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);

  const requests = await TimeOffRequest.find({
    employee: employeeId,
    status: 'Approved',
    startDate: { $lte: periodEnd },
    endDate: { $gte: periodStart }
  }).populate('timeOffType');

  let paidDays = 0;
  let unpaidDays = 0;

  for (const req of requests) {
    const isPaid = req.timeOffType?.payrollIntegration?.isPaid !== false;
    if (isPaid) {
      paidDays += req.duration || 0;
    } else {
      unpaidDays += req.duration || 0;
    }
  }

  return {
    totalRequests: requests.length,
    paidDays,
    unpaidDays
  };
};

/**
 * Reusable Payroll Computation Engine
 * calculatePayslip({ employee, contract, salaryStructure, attendance, timeOff, period })
 */
const calculatePayslip = async ({
  employee,
  contract,
  salaryStructure,
  attendance,
  timeOff,
  period
}) => {
  if (!period || !period.startDate || !period.endDate) {
    const error = new Error('Payroll period with startDate and endDate is required.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Resolve Employee
  let employeeDoc = employee;
  if (!employeeDoc || !employeeDoc._id) {
    const empId = typeof employee === 'string' ? employee : employee?.id;
    employeeDoc = await Employee.findById(empId)
      .populate('department', 'name code')
      .populate('jobPosition', 'name')
      .populate('workingSchedule');
  }

  if (!employeeDoc) {
    const error = new Error('Employee not found for payroll computation.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Find Applicable Contract
  let applicableContract = contract;
  if (!applicableContract) {
    applicableContract = await findApplicableContract(employeeDoc._id, period);
  }

  // 3. Load Salary Structure
  let structureDoc = salaryStructure;
  if (!structureDoc) {
    // Try to find active structure
    structureDoc = await SalaryStructure.findOne({ isActive: true }).sort({ createdAt: -1 });
  } else if (typeof structureDoc === 'string') {
    structureDoc = await SalaryStructure.findById(structureDoc);
  }

  if (!structureDoc) {
    const error = new Error('No active salary structure found to execute payroll computation.');
    error.statusCode = 404;
    throw error;
  }

  // 4. Load & Populate Salary Rules in strict execution sequence
  await structureDoc.populate({
    path: 'salaryRules',
    match: { isActive: true },
    options: { sort: { sequence: 1 } }
  });

  const salaryRules = structureDoc.salaryRules || [];
  if (salaryRules.length === 0) {
    const error = new Error(`Salary structure '${structureDoc.name}' does not have any active salary rules.`);
    error.statusCode = 400;
    throw error;
  }

  // 5. Gather Attendance & Time-off statistics
  const attendanceSummary = attendance || (await getPeriodAttendanceSummary(employeeDoc._id, period));
  const timeOffSummary = timeOff || (await getPeriodTimeOffSummary(employeeDoc._id, period));

  // 6. Build Initial Execution Context
  const context = {
    contract: {
      wage: applicableContract.wage || 0,
      wageType: applicableContract.wageType || 'Monthly',
      salaryStructure: {
        basic: applicableContract.salaryStructure?.basic || 0,
        allowances: applicableContract.salaryStructure?.allowances || {},
        deductions: applicableContract.salaryStructure?.deductions || {}
      }
    },
    attendance: attendanceSummary,
    timeOff: timeOffSummary
  };

  const ruleBreakdown = [];
  const earnings = [];
  const deductions = [];
  let computedGross = 0;
  let computedNet = 0;
  let hasExplicitGrossRule = false;
  let hasExplicitNetRule = false;

  // 7. Execute Rules in Strict Sequence Order
  for (const rule of salaryRules) {
    let ruleAmount = 0;

    switch (rule.computationType) {
      case 'Fixed amount': {
        if (rule.amount > 0) {
          ruleAmount = rule.amount;
        } else if (rule.code === 'BASIC') {
          // Fall back to contract basic wage if rule amount is zero/unconfigured
          ruleAmount = applicableContract.salaryStructure?.basic || applicableContract.wage || 0;
        } else {
          ruleAmount = rule.amount || 0;
        }
        break;
      }

      case 'Percentage': {
        const baseKey = rule.percentageBase || 'BASIC';
        const baseAmount = context[baseKey] !== undefined ? context[baseKey] : (context.BASIC || 0);
        ruleAmount = Math.round(((rule.amount / 100) * baseAmount) * 100) / 100;
        break;
      }

      case 'Formula': {
        ruleAmount = evaluateFormula(rule.formula, context);
        break;
      }

      default: {
        ruleAmount = rule.amount || 0;
      }
    }

    ruleAmount = Math.round(ruleAmount * 100) / 100;

    // Register computed rule into context for subsequent rules to reference
    context[rule.code] = ruleAmount;

    const breakdownItem = {
      ruleId: rule._id,
      name: rule.name,
      code: rule.code,
      category: rule.category,
      sequence: rule.sequence,
      computationType: rule.computationType,
      amount: ruleAmount,
      formula: rule.formula || null
    };
    ruleBreakdown.push(breakdownItem);

    // Group into categories
    if (rule.category === 'Basic' || rule.category === 'Allowances') {
      earnings.push({
        name: rule.name,
        code: rule.code,
        category: rule.category,
        amount: ruleAmount
      });
    } else if (rule.category === 'Deductions') {
      deductions.push({
        name: rule.name,
        code: rule.code,
        category: rule.category,
        amount: ruleAmount
      });
    } else if (rule.category === 'Gross') {
      computedGross = ruleAmount;
      hasExplicitGrossRule = true;
    } else if (rule.category === 'Net') {
      computedNet = ruleAmount;
      hasExplicitNetRule = true;
    }
  }

  // 8. Calculate Final Gross, Total Deductions, and Net
  const totalEarnings = Math.round(earnings.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const totalDeductions = Math.round(deductions.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

  const grossSalary = hasExplicitGrossRule ? computedGross : totalEarnings;
  const netSalary = hasExplicitNetRule ? computedNet : Math.round((grossSalary - totalDeductions) * 100) / 100;

  // 9. Return Complete Salary Breakdown
  return {
    period: {
      startDate: new Date(period.startDate),
      endDate: new Date(period.endDate)
    },
    employee: {
      _id: employeeDoc._id,
      employeeId: employeeDoc.employeeId,
      name: employeeDoc.name,
      email: employeeDoc.email,
      department: employeeDoc.department,
      jobPosition: employeeDoc.jobPosition
    },
    contract: {
      _id: applicableContract._id,
      contractNumber: applicableContract.contractNumber,
      startDate: applicableContract.startDate,
      endDate: applicableContract.endDate,
      wage: applicableContract.wage,
      wageType: applicableContract.wageType,
      status: applicableContract.status
    },
    salaryStructure: {
      _id: structureDoc._id,
      name: structureDoc.name
    },
    attendanceSummary,
    timeOffSummary,
    earnings,
    deductions,
    grossSalary,
    totalDeductions,
    netSalary,
    ruleBreakdown
  };
};

module.exports = {
  evaluateFormula,
  findApplicableContract,
  getPeriodAttendanceSummary,
  getPeriodTimeOffSummary,
  calculatePayslip
};
