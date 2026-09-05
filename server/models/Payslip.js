const mongoose = require('mongoose');

const salaryBreakdownItemSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryRule'
    },
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    sequence: {
      type: Number,
      required: true
    },
    computationType: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    formula: {
      type: String,
      default: null
    }
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema(
  {
    payslipNumber: {
      type: String,
      required: [true, 'Payslip number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    payrun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payrun',
      required: [true, 'Payrun reference is required'],
      index: true
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure is required']
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: [true, 'Contract reference is required']
    },
    period: {
      startDate: {
        type: Date,
        required: [true, 'Period start date is required']
      },
      endDate: {
        type: Date,
        required: [true, 'Period end date is required']
      }
    },
    workedDays: {
      type: Number,
      default: 0
    },
    basic: {
      type: Number,
      default: 0
    },
    allowances: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    gross: {
      type: Number,
      default: 0
    },
    net: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Computed', 'Validated', 'Paid', 'Cancelled'],
        message: '{VALUE} is not a valid payslip status'
      },
      default: 'Computed',
      index: true
    },
    salaryBreakdown: [salaryBreakdownItemSchema],
    attendanceSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    timeOffSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    emailStatus: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      recipientEmail: { type: String, default: '' }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
payslipSchema.index({ employee: 1, 'period.startDate': -1, 'period.endDate': -1 });
payslipSchema.index({ payrun: 1, employee: 1 });

const Payslip = mongoose.model('Payslip', payslipSchema);

module.exports = Payslip;
