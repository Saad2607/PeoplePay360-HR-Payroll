const payrunService = require('../services/payrunService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/payruns/wizard/eligible-employees
 * @desc    Step 2 of Payrun Wizard: query eligible employees (does not create payrun)
 * @access  Private (Admin, HR)
 */
const getEligibleEmployees = async (req, res, next) => {
  try {
    const { salaryStructureId, period } = req.body;
    const result = await payrunService.getEligibleEmployees({ salaryStructureId, period });
    return successResponse(res, result, 'Eligible employees retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payruns
 * @desc    Step 3 of Payrun Wizard: confirm and create Payrun in Draft status
 * @access  Private (Admin, HR)
 */
const createPayrun = async (req, res, next) => {
  try {
    const { name, salaryStructureId, period, selectedEmployees, notes } = req.body;
    const payrun = await payrunService.createPayrun({
      name,
      salaryStructureId,
      period,
      selectedEmployees,
      notes,
      user: req.user
    });

    return successResponse(res, payrun, 'Payrun created successfully in Draft status', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payruns
 * @desc    List all payruns with filtering and pagination
 * @access  Private (Admin, HR)
 */
const getPayruns = async (req, res, next) => {
  try {
    const { payruns, total, page, limit } = await payrunService.getPayruns(req.query);
    return paginatedResponse(res, payruns, page, limit, total, 'Payruns retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payruns/:id
 * @desc    Get detailed payrun by ID
 * @access  Private (Admin, HR)
 */
const getPayrunById = async (req, res, next) => {
  try {
    const payrun = await payrunService.getPayrunById(req.params.id);
    return successResponse(res, payrun, 'Payrun retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/payruns/:id
 * @desc    Delete Draft payrun
 * @access  Private (Admin, HR)
 */
const deletePayrun = async (req, res, next) => {
  try {
    const result = await payrunService.deletePayrun(req.params.id);
    return successResponse(res, result, 'Payrun deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payruns/:id/compute
 * @desc    Compute payrun: generate and store payslips for all selected employees
 * @access  Private (Admin, HR)
 */
const computePayrun = async (req, res, next) => {
  try {
    const payrun = await payrunService.computePayrun(req.params.id, req.user);
    return successResponse(res, payrun, 'Payrun computed and payslips generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payruns/:id/validate
 * @desc    Validate payrun using the payroll validation engine
 * @access  Private (Admin, HR)
 */
const validatePayrun = async (req, res, next) => {
  try {
    const payrun = await payrunService.validatePayrun(req.params.id, req.user);
    return successResponse(res, payrun, 'Payrun successfully validated and approved');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payruns/:id/validate
 * @desc    Run payroll validation check without updating state (read-only audit)
 * @access  Private (Admin, HR)
 */
const checkValidation = async (req, res, next) => {
  try {
    const result = await payrunService.checkPayrunValidation(req.params.id);
    return successResponse(res, result, 'Payroll validation inspection completed');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payruns/:id/mark-paid
 * @desc    Mark a validated payrun and all its payslips as Paid
 * @access  Private (Admin, HR)
 */
const markPaid = async (req, res, next) => {
  try {
    const { paymentMethod, reference } = req.body;
    const payrun = await payrunService.markPaid(
      req.params.id,
      { paymentMethod, reference },
      req.user
    );
    return successResponse(res, payrun, 'Payrun and payslips marked as Paid successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEligibleEmployees,
  createPayrun,
  getPayruns,
  getPayrunById,
  deletePayrun,
  computePayrun,
  validatePayrun,
  checkValidation,
  markPaid
};

