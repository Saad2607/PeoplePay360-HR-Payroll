const mongoose = require('mongoose');

const timeOffRequestSchema = new mongoose.Schema(
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
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0.5, 'Duration must be at least 0.5 (half day or half hour)']
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave request is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Refused', 'Cancelled'],
        message: '{VALUE} is not a valid request status'
      },
      default: 'Pending',
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actionedAt: {
      type: Date,
      default: null
    },
    refusalReason: {
      type: String,
      trim: true,
      default: null
    },
    allocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Allocation',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for fast status queries and employee history
timeOffRequestSchema.index({ employee: 1, status: 1 });
timeOffRequestSchema.index({ startDate: -1, endDate: -1 });

// Date validation hook
timeOffRequestSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    if (new Date(this.endDate) < new Date(this.startDate)) {
      return next(new Error('End date cannot precede start date.'));
    }
  }
  next();
});

const TimeOffRequest = mongoose.model('TimeOffRequest', timeOffRequestSchema);

module.exports = TimeOffRequest;
