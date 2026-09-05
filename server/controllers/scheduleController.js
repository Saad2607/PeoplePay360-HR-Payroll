const WorkingSchedule = require('../models/WorkingSchedule');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const { calculateWeeklyHours } = require('../utils/scheduleCalculator');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/schedules
 * @desc    Get all active working schedules enriched with assignment counts
 * @access  Private
 */
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await WorkingSchedule.find({ isActive: true }).sort({ name: 1 }).lean();

    // Aggregate counts of employees and contracts using each schedule
    const [employeeCounts, contractCounts] = await Promise.all([
      Employee.aggregate([
        { $match: { status: { $ne: 'Terminated' } } },
        { $group: { _id: '$workingSchedule', count: { $sum: 1 } } }
      ]),
      Contract.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: '$workingSchedule', count: { $sum: 1 } } }
      ])
    ]);

    const empCountMap = {};
    employeeCounts.forEach((c) => {
      if (c._id) empCountMap[c._id.toString()] = c.count;
    });

    const contractCountMap = {};
    contractCounts.forEach((c) => {
      if (c._id) contractCountMap[c._id.toString()] = c.count;
    });

    const enrichedSchedules = schedules.map((sched) => ({
      ...sched,
      assignedEmployeeCount: empCountMap[sched._id.toString()] || 0,
      assignedContractCount: contractCountMap[sched._id.toString()] || 0
    }));

    return successResponse(res, enrichedSchedules, 'Working schedules retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/schedules/:id
 * @desc    Get working schedule by ID with assigned rosters
 * @access  Private
 */
const getScheduleById = async (req, res, next) => {
  try {
    const schedule = await WorkingSchedule.findById(req.params.id)
      .populate('assignedEmployees', 'name email employeeId department jobPosition status')
      .populate('assignedContracts', 'contractNumber employee wage status');

    if (!schedule) {
      return errorResponse(res, 'Working schedule not found', 404);
    }

    return successResponse(res, schedule, 'Working schedule retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/schedules
 * @desc    Create a new working schedule with strictly calculated weekly hours
 * @access  Private (HR Managers, Admin)
 */
const createSchedule = async (req, res, next) => {
  try {
    const { name, type, weeklyWorkingDays, startTime, endTime, breakDuration } = req.body;

    // Calculate weekly hours automatically (manual value is never the source of truth)
    const calculatedHours = calculateWeeklyHours(startTime, endTime, breakDuration, weeklyWorkingDays);

    const schedule = await WorkingSchedule.create({
      name,
      type,
      weeklyWorkingDays,
      startTime,
      endTime,
      breakDuration: breakDuration !== undefined ? breakDuration : 60,
      calculatedWeeklyHours: calculatedHours
    });

    return successResponse(res, schedule, 'Working schedule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/schedules/:id
 * @desc    Update a working schedule (re-calculates weekly hours)
 * @access  Private (HR Managers, Admin)
 */
const updateSchedule = async (req, res, next) => {
  try {
    const existing = await WorkingSchedule.findById(req.params.id);
    if (!existing) {
      return errorResponse(res, 'Working schedule not found', 404);
    }

    const startTime = req.body.startTime || existing.startTime;
    const endTime = req.body.endTime || existing.endTime;
    const breakDuration = req.body.breakDuration !== undefined ? req.body.breakDuration : existing.breakDuration;
    const weeklyWorkingDays = req.body.weeklyWorkingDays || existing.weeklyWorkingDays;

    // Enforce calculation: Start Time - End Time - Break * Days
    req.body.calculatedWeeklyHours = calculateWeeklyHours(startTime, endTime, breakDuration, weeklyWorkingDays);

    const schedule = await WorkingSchedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return successResponse(res, schedule, 'Working schedule updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/schedules/:id
 * @desc    Delete or deactivate a schedule
 * @access  Private (Admin only)
 */
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await WorkingSchedule.findById(req.params.id);
    if (!schedule) {
      return errorResponse(res, 'Working schedule not found', 404);
    }

    const assignedCount = await Employee.countDocuments({
      workingSchedule: req.params.id,
      status: { $ne: 'Terminated' }
    });

    if (assignedCount > 0) {
      return errorResponse(
        res,
        `Cannot delete schedule '${schedule.name}'. ${assignedCount} active employee(s) are assigned to it. Please reassign them first.`,
        400
      );
    }

    schedule.isActive = false;
    await schedule.save();

    return successResponse(res, schedule, 'Working schedule deactivated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/schedules/assign-employee
 * @desc    Assign a working schedule to an employee
 * @access  Private (HR Managers, Admin)
 */
const assignScheduleToEmployee = async (req, res, next) => {
  try {
    const { employeeId, scheduleId } = req.body;

    if (!employeeId || !scheduleId) {
      return errorResponse(res, 'Both employeeId and scheduleId are required.', 400);
    }

    const [employee, schedule] = await Promise.all([
      Employee.findById(employeeId),
      WorkingSchedule.findById(scheduleId)
    ]);

    if (!employee) {
      return errorResponse(res, `Employee not found with id: ${employeeId}`, 404);
    }

    if (!schedule) {
      return errorResponse(res, `Working schedule not found with id: ${scheduleId}`, 404);
    }

    employee.workingSchedule = schedule._id;
    await employee.save();

    const updatedEmployee = await Employee.findById(employee._id)
      .populate('department', 'name code')
      .populate('jobPosition', 'name')
      .populate('workingSchedule');

    return successResponse(
      res,
      updatedEmployee,
      `Working schedule '${schedule.name}' successfully assigned to employee '${employee.name}'`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/schedules/assign-contract
 * @desc    Assign a working schedule to a contract
 * @access  Private (HR Managers, Admin)
 */
const assignScheduleToContract = async (req, res, next) => {
  try {
    const { contractId, scheduleId } = req.body;

    if (!contractId || !scheduleId) {
      return errorResponse(res, 'Both contractId and scheduleId are required.', 400);
    }

    const [contract, schedule] = await Promise.all([
      Contract.findById(contractId),
      WorkingSchedule.findById(scheduleId)
    ]);

    if (!contract) {
      return errorResponse(res, `Contract not found with id: ${contractId}`, 404);
    }

    if (!schedule) {
      return errorResponse(res, `Working schedule not found with id: ${scheduleId}`, 404);
    }

    contract.workingSchedule = schedule._id;
    await contract.save();

    const updatedContract = await Contract.findById(contract._id)
      .populate('employee', 'name email employeeId')
      .populate('workingSchedule');

    return successResponse(
      res,
      updatedContract,
      `Working schedule '${schedule.name}' successfully assigned to contract '${contract.contractNumber}'`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  assignScheduleToEmployee,
  assignScheduleToContract
};
