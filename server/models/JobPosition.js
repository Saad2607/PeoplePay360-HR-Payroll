const mongoose = require('mongoose');

const jobPositionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Job position name is required'],
      trim: true,
      maxlength: [100, 'Position name cannot exceed 100 characters']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
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

// Prevent duplicate position names within the same department
jobPositionSchema.index({ name: 1, department: 1 }, { unique: true });

// Virtual for employees holding this position
jobPositionSchema.virtual('employees', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'jobPosition'
});

const JobPosition = mongoose.model('JobPosition', jobPositionSchema);

module.exports = JobPosition;
