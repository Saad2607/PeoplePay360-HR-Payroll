const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    email: {
      type: String,
      required: [true, 'Employee email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    jobPosition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosition',
      required: [true, 'Job position is required']
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    employeeType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'],
      default: 'Full-Time'
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Terminated', 'Probation'],
      default: 'Active'
    },
    workingSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      required: [true, 'Working schedule is required']
    },
    activeContract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    bankDetails: {
      accountName: { type: String, trim: true, default: '' },
      accountNumber: { type: String, trim: true, default: '' },
      bankName: { type: String, trim: true, default: '' },
      routingNumber: { type: String, trim: true, default: '' },
      iban: { type: String, trim: true, default: '' },
      swiftCode: { type: String, trim: true, default: '' }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for all historical contracts belonging to this employee
employeeSchema.virtual('contracts', {
  ref: 'Contract',
  localField: '_id',
  foreignField: 'employee'
});

// Virtual for direct report employees (people who report to this manager)
employeeSchema.virtual('directReports', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'manager'
});

// Virtual for attendance records
employeeSchema.virtual('attendances', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'employee'
});

// Virtual for Time Off / Leave requests
employeeSchema.virtual('timeOffRequests', {
  ref: 'TimeOff',
  localField: '_id',
  foreignField: 'employee'
});

// Virtual for Leave / Benefit Allocations
employeeSchema.virtual('allocations', {
  ref: 'LeaveAllocation',
  localField: '_id',
  foreignField: 'employee'
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
