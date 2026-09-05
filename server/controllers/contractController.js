const Contract = require('../models/Contract');
const Employee = require('../models/Employee');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/contracts
 * @desc    Get all contracts with filters
 * @access  Private (Admin, HR)
 */
const getContracts = async (req, res, next) => {
  try {
    const { status, department, employee } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (employee) filter.employee = employee;

    const contracts = await Contract.find(filter)
      .populate('employee', 'name email employeeId')
      .populate('department', 'name code')
      .populate('jobPosition', 'name')
      .sort({ createdAt: -1 });

    return successResponse(res, contracts, 'Contracts retrieved successfully');
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
    const contract = await Contract.findById(req.params.id)
      .populate('employee', 'name email employeeId')
      .populate('department', 'name code')
      .populate('jobPosition', 'name');

    if (!contract) {
      return errorResponse(res, 'Contract not found', 404);
    }

    return successResponse(res, contract, 'Contract retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/contracts/employee/:employeeId
 * @desc    Get all contracts for a specific employee (including historical contracts)
 * @access  Private
 */
const getContractsByEmployee = async (req, res, next) => {
  try {
    const contracts = await Contract.find({ employee: req.params.employeeId })
      .populate('department', 'name code')
      .populate('jobPosition', 'name')
      .sort({ startDate: -1 });

    return successResponse(res, contracts, 'Employee contracts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/contracts
 * @desc    Create a new contract
 * @access  Private (Admin, HR)
 */
const createContract = async (req, res, next) => {
  try {
    const contract = await Contract.create(req.body);

    // If this contract is Active, set it as the employee's activeContract
    if (contract.status === 'Active') {
      await Employee.findByIdAndUpdate(contract.employee, {
        activeContract: contract._id
      });
    }

    const populated = await Contract.findById(contract._id)
      .populate('employee', 'name email employeeId')
      .populate('department', 'name code')
      .populate('jobPosition', 'name');

    return successResponse(res, populated, 'Contract created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/contracts/:id
 * @desc    Update contract
 * @access  Private (Admin, HR)
 */
const updateContract = async (req, res, next) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('employee', 'name email employeeId')
      .populate('department', 'name code')
      .populate('jobPosition', 'name');

    if (!contract) {
      return errorResponse(res, 'Contract not found', 404);
    }

    // If updated to Active, make sure employee's activeContract points here
    if (contract.status === 'Active') {
      await Employee.findByIdAndUpdate(contract.employee, {
        activeContract: contract._id
      });
    }

    return successResponse(res, contract, 'Contract updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContracts,
  getContractById,
  getContractsByEmployee,
  createContract,
  updateContract
};
