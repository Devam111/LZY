const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    type: { 
      type: String, 
      enum: ['video', 'text', 'pdf', 'image', 'link', 'quiz', 'assignment'], 
      required: true 
    },
    content: { 
      type: String 
    },
    url: { 
      type: String 
    },
    filePath: { 
      type: String 
    },
    duration: { 
      type: Number // in minutes
    },
    order: { 
      type: Number, 
      default: 0 
    },
    isPublished: { 
      type: Boolean, 
      default: true 
    },
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true 
    },
    moduleId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Module' 
    },
    facultyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'SignupUser', 
      required: true 
    },
    // For video materials
    videoData: {
      thumbnail: String,
      transcript: String,
      subtitles: String,
      quality: { type: String, enum: ['720p', '1080p', '4K'], default: '720p' }
    },
    // For text materials
    textData: {
      wordCount: Number,
      readingTime: Number // in minutes
    },
    // For quiz materials
    quizData: {
      questions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
        points: { type: Number, default: 1 }
      }],
      timeLimit: Number, // in minutes
      passingScore: { type: Number, default: 70 },
      attempts: { type: Number, default: 3 }
    },
    // For assignment materials
    assignmentData: {
      instructions: String,
      dueDate: Date,
      maxPoints: Number,
      submissionType: { type: String, enum: ['file', 'text', 'both'], default: 'text' },
      allowedFileTypes: [String]
    },
    // Analytics
    views: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Indexes
materialSchema.index({ courseId: 1, order: 1 });
materialSchema.index({ courseId: 1, type: 1 });
materialSchema.index({ facultyId: 1 });

// Virtual for completion percentage
materialSchema.virtual('completionRate').get(function() {
  if (this.views === 0) return 0;
  return Math.round((this.completions / this.views) * 100);
});

// Method to increment views
materialSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment completions
materialSchema.methods.incrementCompletions = function() {
  this.completions += 1;
  return this.save();
};

// Method to add rating
materialSchema.methods.addRating = function(rating) {
  const totalPoints = this.averageRating * this.totalRatings + rating;
  this.totalRatings += 1;
  this.averageRating = totalPoints / this.totalRatings;
  return this.save();
};

module.exports = mongoose.model('Material', materialSchema);