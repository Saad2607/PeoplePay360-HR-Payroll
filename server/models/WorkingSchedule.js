const mongoose = require('mongoose');

const workingScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Schedule name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Schedule name cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: ['Standard', 'Flexible', 'Shift', 'Part-Time'],
      default: 'Standard'
    },
    weeklyWorkingDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      validate: {
        validator: function (days) {
          return days && days.length > 0;
        },
        message: 'A schedule must have at least one active working day'
      }
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 09:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format (24h)']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 17:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format (24h)']
    },
    breakDuration: {
      type: Number,
      default: 60, // in minutes
      min: [0, 'Break duration cannot be negative'],
      max: [240, 'Break duration cannot exceed 240 minutes']
    },
    calculatedWeeklyHours: {
      type: Number,
      default: 40,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for employees assigned to this schedule
workingScheduleSchema.virtual('assignedEmployees', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'workingSchedule'
});

// Virtual for contracts assigned to this schedule
workingScheduleSchema.virtual('assignedContracts', {
  ref: 'Contract',
  localField: '_id',
  foreignField: 'workingSchedule'
});

const { calculateWeeklyHours } = require('../utils/scheduleCalculator');

// Calculate weekly working hours before save (strictly calculated, not manually overridden)
workingScheduleSchema.pre('save', function (next) {
  if (this.startTime && this.endTime && this.weeklyWorkingDays) {
    this.calculatedWeeklyHours = calculateWeeklyHours(
      this.startTime,
      this.endTime,
      this.breakDuration,
      this.weeklyWorkingDays
    );
  }
  next();
});

const WorkingSchedule = mongoose.model('WorkingSchedule', workingScheduleSchema);

module.exports = WorkingSchedule;
