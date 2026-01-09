const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true 
    },
    materialId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Material' 
    },
    facultyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'SignupUser', 
      required: true 
    },
    questions: [{
      question: { 
        type: String, 
        required: true 
      },
      type: { 
        type: String, 
        enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'], 
        default: 'multiple-choice' 
      },
      options: [String],
      correctAnswer: mongoose.Schema.Types.Mixed, // Can be number, string, or boolean
      explanation: String,
      points: { 
        type: Number, 
        default: 1 
      },
      order: { 
        type: Number, 
        default: 0 
      }
    }],
    timeLimit: { 
      type: Number, 
      default: 30 // in minutes
    },
    passingScore: { 
      type: Number, 
      default: 70 // percentage
    },
    maxAttempts: { 
      type: Number, 
      default: 3 
    },
    isPublished: { 
      type: Boolean, 
      default: true 
    },
    order: { 
      type: Number, 
      default: 0 
    },
    // Analytics
    totalAttempts: { 
      type: Number, 
      default: 0 
    },
    averageScore: { 
      type: Number, 
      default: 0 
    },
    completionRate: { 
      type: Number, 
      default: 0 
    }
  },
  { timestamps: true }
);

// Indexes
quizSchema.index({ courseId: 1, order: 1 });
quizSchema.index({ facultyId: 1 });

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((sum, question) => sum + question.points, 0);
});

// Method to calculate score
quizSchema.methods.calculateScore = function(answers) {
  let correctAnswers = 0;
  let totalPoints = 0;
  
  this.questions.forEach((question, index) => {
    totalPoints += question.points;
    if (answers[index] === question.correctAnswer) {
      correctAnswers += question.points;
    }
  });
  
  return {
    score: correctAnswers,
    totalPoints: totalPoints,
    percentage: Math.round((correctAnswers / totalPoints) * 100)
  };
};

module.exports = mongoose.model('Quiz', quizSchema);