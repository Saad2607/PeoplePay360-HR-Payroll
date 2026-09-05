const Allocation = require('../models/Allocation');
const TimeOffType = require('../models/TimeOffType');
const Employee = require('../models/Employee');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/allocations
 * @desc    Get allocations with filters (Employee: own only; HR/Admin: all)
 * @access  Private
 */
const getAllocations = async (req, res, next) => {
  try {
    const { employee, timeOffType, status, year } = req.query;
    const filter = {};

    // Role check: Employee can only view their own allocations
    if (req.user.role === 'Employee') {
      const empId = req.user.employee?._id || req.user.employee;
      filter.employee = empId;
    } else if (employee) {
      filter.employee = employee;
    }

    if (timeOffType) filter.timeOffType = timeOffType;
    if (status) filter.status = status;

    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      filter['validityPeriod.startDate'] = { $lte: endOfYear };
      filter['validityPeriod.endDate'] = { $gte: startOfYear };
    }

    const allocations = await Allocation.find(filter)
      .populate('employee', 'name email employeeId department jobPosition')
      .populate('timeOffType', 'name code unit allocationRequired approvalWorkflow')
      .populate('approvedBy', 'name email role')
      .sort({ 'validityPeriod.startDate': -1 });

    return successResponse(res, allocations, 'Leave allocations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/allocations/:id
 * @desc    Get allocation by ID
 * @access  Private
 */
const getAllocationById = async (req, res, next) => {
  try {
    const allocation = await Allocation.findById(req.params.id)
      .populate('employee', 'name email employeeId department jobPosition')
      .populate('timeOffType', 'name code unit allocationRequired approvalWorkflow')
      .populate('approvedBy', 'name email role');

    if (!allocation) {
      return errorResponse(res, 'Leave allocation not found', 404);
    }

    if (req.user.role === 'Employee') {
      const empId = (req.user.employee?._id || req.user.employee).toString();
      if (allocation.employee._id.toString() !== empId) {
        return errorResponse(res, 'Forbidden: You cannot view another employee\'s leave allocation.', 403);
      }
    }

    return successResponse(res, allocation, 'Leave allocation retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/allocations
 * @desc    Create a new leave allocation
 * @access  Private (Admin, HR)
 */
const createAllocation = async (req, res, next) => {
  try {
    const { employee, timeOffType, allocatedAmount, validityPeriod, status, notes } = req.body;

    const emp = await Employee.findById(employee);
    if (!emp) {
      return errorResponse(res, 'Employee not found', 404);
    }

    const type = await TimeOffType.findById(timeOffType);
    if (!type) {
      return errorResponse(res, 'Time off type not found', 404);
    }

    const allocation = await Allocation.create({
      employee,
      timeOffType,
      allocatedAmount,
      validityPeriod,
      status: status || 'Approved',
      approvedBy: req.user._id,
      notes: notes || ''
    });

    const populated = await Allocation.findById(allocation._id)
      .populate('employee', 'name email employeeId department jobPosition')
      .populate('timeOffType', 'name code unit allocationRequired')
      .populate('approvedBy', 'name email role');

    return successResponse(res, populated, 'Leave allocation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/allocations/:id
 * @desc    Update an allocation
 * @access  Private (Admin, HR)
 */
const updateAllocation = async (req, res, next) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return errorResponse(res, 'Leave allocation not found', 404);
    }

    const { allocatedAmount, takenAmount, validityPeriod, status, notes } = req.body;

    if (allocatedAmount !== undefined) allocation.allocatedAmount = allocatedAmount;
    if (takenAmount !== undefined) allocation.takenAmount = takenAmount;
    if (validityPeriod?.startDate) allocation.validityPeriod.startDate = validityPeriod.startDate;
    if (validityPeriod?.endDate) allocation.validityPeriod.endDate = validityPeriod.endDate;
    if (status) allocation.status = status;
    if (notes !== undefined) allocation.notes = notes;

    await allocation.save();

    const populated = await Allocation.findById(allocation._id)
      .populate('employee', 'name email employeeId department jobPosition')
      .populate('timeOffType', 'name code unit')
      .populate('approvedBy', 'name email role');

    return successResponse(res, populated, 'Leave allocation updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/allocations/employee/:employeeId/balance
 * @desc    Get leave balance summary for an employee across all time off types
 * @access  Private (Employee: own only; HR/Admin: any)
 */
const getEmployeeLeaveBalance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    if (req.user.role === 'Employee') {
      const ownEmpId = (req.user.employee?._id || req.user.employee).toString();
      if (employeeId !== ownEmpId) {
        return errorResponse(res, 'Forbidden: You cannot view another employee\'s leave balance.', 403);
      }
    }

    const employee = await Employee.findById(employeeId).select('name email employeeId department jobPosition');
    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }

    // Find all active allocations for this employee that are currently valid or active
    const now = new Date();
    const allocations = await Allocation.find({
      employee: employeeId,
      status: 'Approved',
      'validityPeriod.startDate': { $lte: now },
      'validityPeriod.endDate': { $gte: now }
    }).populate('timeOffType', 'name code unit allocationRequired payrollIntegration');

    // Aggregate balance by TimeOffType
    const balances = allocations.map((alloc) => ({
      allocationId: alloc._id,
      timeOffType: alloc.timeOffType,
      allocatedAmount: alloc.allocatedAmount,
      takenAmount: alloc.takenAmount,
      remainingAmount: alloc.remainingAmount,
      validityPeriod: alloc.validityPeriod
    }));

    return successResponse(
      res,
      {
        employee,
        balances
      },
      'Employee leave balance retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  getEmployeeLeaveBalance
};
