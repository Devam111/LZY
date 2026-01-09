const mongoose = require('mongoose');

const materialCompletionSchema = new mongoose.Schema(
  {
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'SignupUser', 
      required: true 
    },
    materialId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Material', 
      required: true 
    },
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true 
    },
    completedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

// Index for efficient queries - ensure one completion per student per material
materialCompletionSchema.index({ studentId: 1, materialId: 1 }, { unique: true });
materialCompletionSchema.index({ studentId: 1, courseId: 1 });

module.exports = mongoose.model('MaterialCompletion', materialCompletionSchema);

