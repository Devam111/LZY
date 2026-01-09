const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SignupUser', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, default: 0 }, // in minutes
    activity: { 
      type: String, 
      enum: ['browsing', 'watching', 'reading', 'quiz', 'assignment', 'discussion'], 
      default: 'browsing' 
    },
    isActive: { type: Boolean, default: true },
    lastActivityTime: { type: Date, default: Date.now },
    totalActiveTime: { type: Number, default: 0 }, // in minutes
    idleTime: { type: Number, default: 0 }, // in minutes
    lessonsCompleted: { type: Number, default: 0 },
    materialsAccessed: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Material' 
    }],
    quizAttempts: [{
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
      score: Number,
      completedAt: Date
    }],
    sessionData: {
      pageViews: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      scrollDepth: { type: Number, default: 0 },
      focusTime: { type: Number, default: 0 } // time spent with tab in focus
    },
    deviceInfo: {
      userAgent: String,
      screenResolution: String,
      browser: String
    }
  },
  { timestamps: true }
);

// Index for efficient queries
studySessionSchema.index({ studentId: 1, startTime: -1 });
studySessionSchema.index({ studentId: 1, isActive: 1 });
studySessionSchema.index({ courseId: 1, startTime: -1 });
studySessionSchema.index({ lastActivityTime: 1 });

// Virtual for current session duration
studySessionSchema.virtual('currentDuration').get(function() {
  if (this.isActive) {
    const now = new Date();
    return Math.floor((now - this.startTime) / (1000 * 60)); // in minutes
  }
  return this.duration;
});

// Method to update activity
studySessionSchema.methods.updateActivity = function(activity, additionalData = {}) {
  this.activity = activity;
  this.lastActivityTime = new Date();
  
  if (additionalData.lessonCompleted) {
    this.lessonsCompleted += 1;
  }
  
  if (additionalData.materialId) {
    this.materialsAccessed.push(additionalData.materialId);
  }
  
  if (additionalData.quizResult) {
    this.quizAttempts.push(additionalData.quizResult);
  }
  
  return this.save();
};

// Method to end session
studySessionSchema.methods.endSession = function() {
  this.isActive = false;
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime - this.startTime) / (1000 * 60));
  this.totalActiveTime = this.duration - this.idleTime;
  return this.save();
};

// Method to calculate focus percentage
studySessionSchema.methods.getFocusPercentage = function() {
  if (this.duration === 0) return 0;
  return Math.round((this.totalActiveTime / this.duration) * 100);
};

// Static method to get active sessions
studySessionSchema.statics.getActiveSessions = function(studentId) {
  return this.find({ studentId, isActive: true });
};

// Static method to get daily study time
studySessionSchema.statics.getDailyStudyTime = function(studentId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    studentId,
    startTime: { $gte: startOfDay, $lte: endOfDay }
  });
};

module.exports = mongoose.model('StudySession', studySessionSchema);
