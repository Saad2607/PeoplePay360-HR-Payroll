const contractService = require('../services/contractService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/contracts
 * @desc    Get all contracts with filters and pagination
 * @access  Private (HR Managers, Admin)
 */
const getContracts = async (req, res, next) => {
  try {
    const { contracts, total, page, limit } = await contractService.getContracts(req.query);
    return paginatedResponse(res, contracts, page, limit, total, 'Contracts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/contracts/:id
 * @desc    Get contract by ID
 * @access  Private
 */
const getContractById = async (req, res, next) => {
  try {
    const contract = await contractService.getContractById(req.params.id);
    return successResponse(res, contract, 'Contract retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/contracts/employee/:employeeId
 * @desc    Get all contracts for a specific employee (Historical contracts)
 * @access  Private
 */
const getContractsByEmployee = async (req, res, next) => {
  try {
    const contracts = await contractService.getContractsByEmployee(req.params.employeeId);
    return successResponse(res, contracts, 'Employee contract history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/contracts/active/:employeeId
 * @desc    Get currently active contract for an employee
 * @access  Private
 */
const getActiveContract = async (req, res, next) => {
  try {
    const contract = await contractService.getActiveContract(req.params.employeeId);
    if (!contract) {
      return successResponse(res, null, 'No active contract found for this employee');
    }
    return successResponse(res, contract, 'Active contract retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/contracts
 * @desc    Create a new contract (with overlap prevention)
 * @access  Private (HR Managers, Admin)
 */
const createContract = async (req, res, next) => {
  try {
    const contract = await contractService.createContract(req.body);
    return successResponse(res, contract, 'Contract created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/contracts/:id
 * @desc    Update a contract (with overlap prevention)
 * @access  Private (HR Managers, Admin)
 */
const updateContract = async (req, res, next) => {
  try {
    const contract = await contractService.updateContract(req.params.id, req.body);
    return successResponse(res, contract, 'Contract updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/contracts/:id
 * @desc    Delete a contract
 * @access  Private (Admin only)
 */
const deleteContract = async (req, res, next) => {
  try {
    const contract = await contractService.deleteContract(req.params.id);
    return successResponse(res, contract, 'Contract deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/contracts/applicable
 * @desc    Get contract applicable to a specific payroll period
 * @access  Private (HR Managers, Admin)
 */
const getApplicableContract = async (req, res, next) => {
  try {
    const { employeeId, payrollPeriod } = req.body;
    const contract = await contractService.getApplicableContract(employeeId, payrollPeriod);
    return successResponse(res, contract, 'Applicable contract for period retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/contracts/applicable/:employeeId
 * @desc    Get contract applicable to dates passed in query params
 * @access  Private (HR Managers, Admin)
 */
const getApplicableContractByQuery = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const contract = await contractService.getApplicableContract(req.params.employeeId, { startDate, endDate });
    return successResponse(res, contract, 'Applicable contract for period retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContracts,
  getContractById,
  getContractsByEmployee,
  getActiveContract,
  getApplicableContract,
  getApplicableContractByQuery,
  createContract,
  updateContract,
  deleteContract
};
