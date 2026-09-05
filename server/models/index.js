const User = require('./User');
const Employee = require('./Employee');
const Department = require('./Department');
const JobPosition = require('./JobPosition');
const Contract = require('./Contract');
const WorkingSchedule = require('./WorkingSchedule');
const Attendance = require('./Attendance');
const TimeOffType = require('./TimeOffType');
const Allocation = require('./Allocation');
const TimeOffRequest = require('./TimeOffRequest');
const SalaryStructure = require('./SalaryStructure');
const SalaryRule = require('./SalaryRule');
const Payrun = require('./Payrun');
const Payslip = require('./Payslip');

module.exports = {
  User,
  Employee,
  Department,
  JobPosition,
  Contract,
  WorkingSchedule,
  Attendance,
  TimeOffType,
  Allocation,
  LeaveAllocation: Allocation,
  TimeOffRequest,
  SalaryStructure,
  SalaryRule,
  Payrun,
  Payslip
};
