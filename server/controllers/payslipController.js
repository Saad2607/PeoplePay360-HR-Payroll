const payrunService = require('../services/payrunService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/payslips
 * @desc    Get payslips (Employee sees own; HR/Admin see all)
 * @access  Private
 */
const getPayslips = async (req, res, next) => {
  try {
    const { payslips, total, page, limit } = await payrunService.getPayslips(req.query, req.user);
    return paginatedResponse(res, payslips, page, limit, total, 'Payslips retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payslips/:id
 * @desc    Get single payslip with detailed rule breakdown
 * @access  Private
 */
const getPayslipById = async (req, res, next) => {
  try {
    const payslip = await payrunService.getPayslipById(req.params.id, req.user);
    return successResponse(res, payslip, 'Payslip details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayslips,
  getPayslipById
};
