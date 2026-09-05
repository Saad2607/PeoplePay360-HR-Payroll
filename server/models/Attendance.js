const mongoose = require('mongoose');

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    correctedAt: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    originalValues: {
      checkIn: { type: Date, default: null },
      checkOut: { type: Date, default: null },
      workedHours: { type: Number, default: 0 },
      status: { type: String, default: null }
    }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in time is required']
    },
    checkOut: {
      type: Date,
      default: null
    },
    workedHours: {
      type: Number,
      default: 0,
      min: [0, 'Worked hours cannot be negative']
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: [0, 'Overtime hours cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Late', 'Half-Day', 'Absent', 'On Leave'],
        message: '{VALUE} is not a valid attendance status'
      },
      default: 'Present',
      index: true
    },
    isManuallyCorrected: {
      type: Boolean,
      default: false,
      index: true
    },
    correction: {
      type: attendanceCorrectionSchema,
      default: () => ({})
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

// Compound indexes for fast historical queries and lookup
attendanceSchema.index({ employee: 1, date: -1 });
attendanceSchema.index({ employee: 1, checkOut: 1 });
attendanceSchema.index({ date: -1, status: 1 });

/**
 * Pre-save hook: Enforce worked hours mathematical calculation.
 * Worked hours MUST be computed strictly from checkIn and checkOut.
 * Client-supplied workedHours values are never allowed as the source of truth.
 */
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    if (diffMs < 0) {
      return next(new Error('Check-out time cannot precede check-in time.'));
    }
    // Convert ms to decimal hours rounded to 2 decimal places
    this.workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  } else {
    this.workedHours = 0;
    this.overtimeHours = 0;
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
