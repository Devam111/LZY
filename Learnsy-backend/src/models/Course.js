const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    duration: String,
    order: { type: Number, default: 0 },
    lessons: [{
      title: { type: String, required: true },
      description: String,
      duration: String,
      type: { type: String, enum: ['video', 'text', 'quiz', 'assignment'], default: 'text' },
      content: String,
      order: { type: Number, default: 0 }
    }]
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    duration: { type: String },
    price: { type: Number, default: 0 },
    thumbnail: String,
    modules: [moduleSchema],
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SignupUser', required: true },
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SignupUser' }],
    materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
    isPublished: { type: Boolean, default: false },
    enrollmentCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    tags: [String],
    prerequisites: [String],
    learningOutcomes: [String]
  },
  { timestamps: true }
);

// Index for efficient queries
courseSchema.index({ title: 'text', description: 'text', category: 'text' });
courseSchema.index({ facultyId: 1 });
courseSchema.index({ isPublished: 1 });

// Virtual for total lessons count
courseSchema.virtual('totalLessons').get(function() {
  return this.modules.reduce((total, module) => total + module.lessons.length, 0);
});

// Method to get enrollment count
courseSchema.methods.getEnrollmentCount = async function() {
  const Enrollment = mongoose.model('Enrollment');
  const count = await Enrollment.countDocuments({ 
    courseId: this._id, 
    status: 'active' 
  });
  this.enrollmentCount = count;
  return this.save();
};

// Method to check if student is enrolled
courseSchema.methods.isStudentEnrolled = async function(studentId) {
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findOne({ 
    courseId: this._id, 
    studentId: studentId,
    status: 'active'
  });
  return !!enrollment;
};

module.exports = mongoose.model('Course', courseSchema);


