const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'SignupUser', 
      required: true 
    },
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true 
    },
    enrolledAt: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      enum: ['active', 'completed', 'dropped'], 
      default: 'active' 
    },
    progress: {
      lessonsCompleted: { type: Number, default: 0 },
      totalLessons: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      lastAccessed: { type: Date, default: Date.now }
    },
    studyTime: {
      totalMinutes: { type: Number, default: 0 },
      sessions: [{
        date: { type: Date, default: Date.now },
        minutes: { type: Number, default: 0 }
      }]
    }
  },
  { 
    timestamps: true,
    // Ensure unique combination of student and course
    unique: true
  }
);

// Compound index to ensure one enrollment per student per course
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Virtual for progress percentage
enrollmentSchema.virtual('progressPercentage').get(function() {
  if (this.progress.totalLessons === 0) return 0;
  const percentage = (this.progress.lessonsCompleted / this.progress.totalLessons) * 100;
  return Math.min(Math.round(percentage), 100); // Cap at 100%
});

// Method to update progress
enrollmentSchema.methods.updateProgress = function(lessonsCompleted, totalLessons) {
  this.progress.lessonsCompleted = lessonsCompleted;
  this.progress.totalLessons = totalLessons;
  this.progress.percentage = this.progressPercentage;
  this.progress.lastAccessed = new Date();
  return this.save();
};

// Method to add study session
enrollmentSchema.methods.addStudySession = function(minutes) {
  this.studyTime.totalMinutes += minutes;
  this.studyTime.sessions.push({
    date: new Date(),
    minutes: minutes
  });
  return this.save();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
