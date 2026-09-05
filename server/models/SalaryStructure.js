const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Salary structure name is required'],
      unique: true,
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    salaryRules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryRule'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

salaryStructureSchema.index({ name: 1, isActive: 1 });

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

module.exports = SalaryStructure;
