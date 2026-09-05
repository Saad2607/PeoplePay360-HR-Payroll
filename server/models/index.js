const User = require('./User');
const Employee = require('./Employee');
const Department = require('./Department');
const JobPosition = require('./JobPosition');
const Contract = require('./Contract');
const WorkingSchedule = require('./WorkingSchedule');
const Attendance = require('./Attendance');
const TimeOffType = require('./TimeOffType');
const Allocation = require('./Allocation');

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
  LeaveAllocation: Allocation
};
