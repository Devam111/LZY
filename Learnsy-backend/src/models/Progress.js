const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SignupUser', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    lessonsCompleted: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    quizzesTaken: { type: Number, default: 0 },
    quizzesPassed: { type: Number, default: 0 },
    avgStudyTime: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    studyCalendar: [{ 
      date: { type: Date, default: Date.now }, 
      minutes: { type: Number, default: 0 },
      lessonsCompleted: { type: Number, default: 0 }
    }],
    achievements: [{
      type: { type: String, required: true },
      title: { type: String, required: true },
      description: String,
      unlockedAt: { type: Date, default: Date.now }
    }],
    lastAccessed: { type: Date, default: Date.now },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastStudyDate: Date
    }
  },
  { timestamps: true }
);

// Index for efficient queries
progressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Virtual for progress percentage
progressSchema.virtual('progressPercentage').get(function() {
  if (this.totalLessons === 0) return 0;
  const percentage = (this.lessonsCompleted / this.totalLessons) * 100;
  return Math.min(Math.round(percentage), 100); // Cap at 100%
});

// Method to update study streak
progressSchema.methods.updateStreak = function() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (!this.streak.lastStudyDate) {
    this.streak.current = 1;
  } else {
    const lastStudy = new Date(this.streak.lastStudyDate);
    const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.streak.current += 1;
    } else if (daysDiff > 1) {
      this.streak.current = 1;
    }
  }
  
  this.streak.lastStudyDate = today;
  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current;
  }
  
  return this.save();
};

module.exports = mongoose.model('Progress', progressSchema);


