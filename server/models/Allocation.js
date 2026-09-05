const mongoose = require('mongoose');

const validityPeriodSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: [true, 'Validity period start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Validity period end date is required']
    }
  },
  { _id: false }
);

const allocationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    timeOffType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffType',
      required: [true, 'Time off type reference is required'],
      index: true
    },
    allocatedAmount: {
      type: Number,
      required: [true, 'Allocated amount is required'],
      min: [0, 'Allocated amount cannot be negative']
    },
    takenAmount: {
      type: Number,
      default: 0,
      min: [0, 'Taken amount cannot be negative']
    },
    remainingAmount: {
      type: Number,
      min: [0, 'Remaining amount cannot be negative']
    },
    validityPeriod: {
      type: validityPeriodSchema,
      required: [true, 'Validity period is required']
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Pending', 'Approved', 'Refused', 'Cancelled'],
        message: '{VALUE} is not a valid allocation status'
      },
      default: 'Approved',
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for querying active allocation for an employee & type in a date range
allocationSchema.index({
  employee: 1,
  timeOffType: 1,
  'validityPeriod.startDate': 1,
  'validityPeriod.endDate': 1,
  status: 1
});

// Pre-save validation and remaining amount calculation
allocationSchema.pre('save', function (next) {
  if (this.validityPeriod) {
    if (new Date(this.validityPeriod.endDate) < new Date(this.validityPeriod.startDate)) {
      return next(new Error('Validity period end date cannot be before start date.'));
    }
  }

  // Ensure remaining amount is mathematically computed
  const allocated = Number(this.allocatedAmount) || 0;
  const taken = Number(this.takenAmount) || 0;
  this.remainingAmount = Math.round((allocated - taken) * 100) / 100;

  if (this.remainingAmount < 0) {
    return next(new Error('Taken amount cannot exceed allocated amount (negative remaining balance).'));
  }

  next();
});

const Allocation = mongoose.model('Allocation', allocationSchema);

module.exports = Allocation;
