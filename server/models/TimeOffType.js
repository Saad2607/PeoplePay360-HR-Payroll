const mongoose = require('mongoose');

const payrollIntegrationSchema = new mongoose.Schema(
  {
    affectsPayroll: {
      type: Boolean,
      default: false
    },
    isPaid: {
      type: Boolean,
      default: true
    },
    payrollCode: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const timeOffTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Time off type name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Time off code is required (e.g. PTO, SICK)'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Code cannot exceed 20 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    unit: {
      type: String,
      enum: {
        values: ['days', 'hours'],
        message: '{VALUE} is not a valid unit. Allowed units: days, hours'
      },
      default: 'days',
      required: [true, 'Unit of measurement (days or hours) is required']
    },
    allocationRequired: {
      type: Boolean,
      default: true
    },
    approvalWorkflow: {
      type: String,
      enum: {
        values: ['None', 'Manager', 'HR', 'Manager_and_HR'],
        message: '{VALUE} is not a valid approval workflow'
      },
      default: 'HR'
    },
    payrollIntegration: {
      type: payrollIntegrationSchema,
      default: () => ({ affectsPayroll: false, isPaid: true, payrollCode: '' })
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

const TimeOffType = mongoose.model('TimeOffType', timeOffTypeSchema);

module.exports = TimeOffType;
