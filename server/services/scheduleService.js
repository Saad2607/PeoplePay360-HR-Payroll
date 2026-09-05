const WorkingSchedule = require('../models/WorkingSchedule');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const { calculateWeeklyHours } = require('../utils/scheduleCalculator');

/**
 * Fetch all active working schedules with assignment counts
 */
const getSchedules = async () => {
  const schedules = await WorkingSchedule.find({ isActive: true }).sort({ name: 1 }).lean();

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

  const empMap = {};
  employeeCounts.forEach((c) => {
    if (c._id) empMap[c._id.toString()] = c.count;
  });

  const contractMap = {};
  contractCounts.forEach((c) => {
    if (c._id) contractMap[c._id.toString()] = c.count;
  });

  return schedules.map((s) => ({
    ...s,
    assignedEmployeeCount: empMap[s._id.toString()] || 0,
    assignedContractCount: contractMap[s._id.toString()] || 0
  }));
};

/**
 * Fetch single working schedule with assigned rosters
 */
const getScheduleById = async (id) => {
  const schedule = await WorkingSchedule.findById(id)
    .populate('assignedEmployees', 'name email employeeId department jobPosition status')
    .populate('assignedContracts', 'contractNumber employee wage status');

  if (!schedule) {
    const error = new Error(`Working schedule not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  return schedule;
};

/**
 * Create a new working schedule (enforces weekly hours calculation)
 */
const createSchedule = async (scheduleData) => {
  const { name, type, weeklyWorkingDays, startTime, endTime, breakDuration } = scheduleData;

  const existing = await WorkingSchedule.findOne({ name: name.trim() });
  if (existing) {
    const error = new Error(`A working schedule with name '${name.trim()}' already exists.`);
    error.statusCode = 409;
    throw error;
  }

  const calculatedHours = calculateWeeklyHours(startTime, endTime, breakDuration, weeklyWorkingDays);

  const schedule = await WorkingSchedule.create({
    name: name.trim(),
    type,
    weeklyWorkingDays,
    startTime,
    endTime,
    breakDuration: breakDuration !== undefined ? breakDuration : 60,
    calculatedWeeklyHours: calculatedHours
  });

  return schedule;
};

/**
 * Update a working schedule (re-calculates weekly hours)
 */
const updateSchedule = async (id, updateData) => {
  const existing = await WorkingSchedule.findById(id);
  if (!existing) {
    const error = new Error(`Working schedule not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const startTime = updateData.startTime || existing.startTime;
  const endTime = updateData.endTime || existing.endTime;
  const breakDuration = updateData.breakDuration !== undefined ? updateData.breakDuration : existing.breakDuration;
  const weeklyWorkingDays = updateData.weeklyWorkingDays || existing.weeklyWorkingDays;

  updateData.calculatedWeeklyHours = calculateWeeklyHours(startTime, endTime, breakDuration, weeklyWorkingDays);

  const schedule = await WorkingSchedule.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  return schedule;
};

/**
 * Assign schedule to employee
 */
const assignScheduleToEmployee = async (employeeId, scheduleId) => {
  const [employee, schedule] = await Promise.all([
    Employee.findById(employeeId),
    WorkingSchedule.findById(scheduleId)
  ]);

  if (!employee) {
    const error = new Error(`Employee not found with id: ${employeeId}`);
    error.statusCode = 404;
    throw error;
  }

  if (!schedule) {
    const error = new Error(`Working schedule not found with id: ${scheduleId}`);
    error.statusCode = 404;
    throw error;
  }

  employee.workingSchedule = schedule._id;
  await employee.save();

  return Employee.findById(employee._id)
    .populate('department', 'name code')
    .populate('jobPosition', 'name')
    .populate('workingSchedule');
};

/**
 * Assign schedule to contract
 */
const assignScheduleToContract = async (contractId, scheduleId) => {
  const [contract, schedule] = await Promise.all([
    Contract.findById(contractId),
    WorkingSchedule.findById(scheduleId)
  ]);

  if (!contract) {
    const error = new Error(`Contract not found with id: ${contractId}`);
    error.statusCode = 404;
    throw error;
  }

  if (!schedule) {
    const error = new Error(`Working schedule not found with id: ${scheduleId}`);
    error.statusCode = 404;
    throw error;
  }

  contract.workingSchedule = schedule._id;
  await contract.save();

  return Contract.findById(contract._id)
    .populate('employee', 'name email employeeId')
    .populate('workingSchedule');
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  assignScheduleToEmployee,
  assignScheduleToContract
};
