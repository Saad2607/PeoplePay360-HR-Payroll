const payrollService = require('../services/payrollService');
const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/payroll/calculate-payslip
 * @desc    Compute salary breakdown and payslip preview for an employee and period
 * @access  Private (Admin, HR)
 */
const calculateEmployeePayslip = async (req, res, next) => {
  try {
    const { employeeId, period, salaryStructureId, contractId } = req.body;

    const result = await payrollService.calculatePayslip({
      employee: employeeId,
      contract: contractId,
      salaryStructure: salaryStructureId,
      period
    });

    return successResponse(res, result, 'Payslip calculated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payroll/applicable-contract/:employeeId
 * @desc    Find the applicable contract for an employee in a given period
 * @access  Private
 */
const getApplicableContract = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const contract = await payrollService.findApplicableContract(employeeId, {
      startDate,
      endDate
    });

    return successResponse(res, contract, 'Applicable contract retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payroll/dashboard
 * @desc    Retrieve real-time consolidated operational and payroll dashboard metrics
 * @access  Private
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.query, req.user);
    return successResponse(res, summary, 'Dashboard metrics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateEmployeePayslip,
  getApplicableContract,
  getDashboardSummary
};
