const Payrun = require('../models/Payrun');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const SalaryStructure = require('../models/SalaryStructure');

/**
 * Payroll Validation Engine
 * Validates a payrun and all associated employees prior to final approval/validation.
 * 
 * Implements strict checks for:
 * 1. Invalid payroll period
 * 2. Missing or inactive salary structure
 * 3. Missing employee critical info
 * 4. Missing bank details
 * 5. Missing or expired contract for the period
 * 6. Duplicate payslips across overlapping payruns
 * 
 * Returns: { isValid: boolean, errors: string[], warnings: string[], checkedAt: Date }
 */
const validatePayrun = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId)
    .populate('salaryStructure')
    .populate('selectedEmployees');

  if (!payrun) {
    const error = new Error('Payrun not found.');
    error.statusCode = 404;
    throw error;
  }

  const errors = [];
  const warnings = [];

  // 1. Invalid Payroll Period Check
  if (!payrun.period || !payrun.period.startDate || !payrun.period.endDate) {
    errors.push('Invalid payroll period: startDate and endDate are required.');
  } else {
    const start = new Date(payrun.period.startDate);
    const end = new Date(payrun.period.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.push('Invalid payroll period: Provided dates are not valid timestamps.');
    } else if (end <= start) {
      errors.push(`Invalid payroll period: Period endDate (${end.toISOString().split('T')[0]}) must be strictly after startDate (${start.toISOString().split('T')[0]}).`);
    }
  }

  // 2. Missing / Inactive Salary Structure Check
  if (!payrun.salaryStructure) {
    errors.push('Missing salary structure: Payrun is not associated with any salary structure.');
  } else {
    if (payrun.salaryStructure.isActive === false) {
      errors.push(`Salary structure '${payrun.salaryStructure.name}' is currently marked as inactive.`);
    }
    if (!payrun.salaryStructure.salaryRules || payrun.salaryStructure.salaryRules.length === 0) {
      errors.push(`Salary structure '${payrun.salaryStructure.name}' has no salary rules configured.`);
    }
  }

  // 3. Selected Employees Check
  if (!payrun.selectedEmployees || payrun.selectedEmployees.length === 0) {
    errors.push('No employees selected: Payrun must have at least one selected employee.');
  } else {
    const periodStart = new Date(payrun.period.startDate);
    const periodEnd = new Date(payrun.period.endDate);

    for (const emp of payrun.selectedEmployees) {
      const empLabel = emp.name ? `${emp.name} (${emp.employeeId || emp._id})` : `Employee ID ${emp._id}`;

      // 4. Missing Employee Critical Info Check
      if (!emp.name) {
        errors.push(`Missing critical info: Employee record ${emp._id} is missing a full name.`);
      }
      if (!emp.employeeId) {
        errors.push(`Missing critical info: ${empLabel} is missing an employee ID.`);
      }
      if (!emp.department) {
        errors.push(`Missing critical info: ${empLabel} has no department assigned.`);
      }
      if (!emp.jobPosition) {
        errors.push(`Missing critical info: ${empLabel} has no job position assigned.`);
      }
      if (!emp.email) {
        errors.push(`Missing critical info: ${empLabel} is missing an email address.`);
      }
      if (!emp.phone) {
        warnings.push(`Warning: ${empLabel} is missing a contact phone number.`);
      }

      // 5. Missing Bank Details Check
      const hasBank = emp.bankDetails && emp.bankDetails.accountNumber && emp.bankDetails.accountNumber.trim() !== '';
      if (!hasBank) {
        errors.push(`Missing bank details: ${empLabel} does not have a bank account number configured for payroll transfer.`);
      }

      // 6. Missing Contract Check for Payrun Period
      const applicableContract = await Contract.findOne({
        employee: emp._id,
        status: { $in: ['Active', 'Expired'] },
        startDate: { $lte: periodEnd },
        $or: [
          { endDate: null },
          { endDate: { $gte: periodStart } }
        ]
      });

      if (!applicableContract) {
        errors.push(`Missing contract: No active or valid contract found for ${empLabel} covering the period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}.`);
      }

      // 7. Duplicate Payslip Check across overlapping payruns
      const overlappingPayrun = await Payrun.findOne({
        _id: { $ne: payrun._id },
        selectedEmployees: emp._id,
        status: { $in: ['Computed', 'Validated', 'Paid'] },
        'period.startDate': { $lte: periodEnd },
        'period.endDate': { $gte: periodStart }
      });

      if (overlappingPayrun) {
        errors.push(`Duplicate payslip detected: ${empLabel} already belongs to an active payrun '${overlappingPayrun.name}' (${overlappingPayrun.status}) for an overlapping period.`);
      }
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    checkedAt: new Date()
  };
};

module.exports = {
  validatePayrun
};
