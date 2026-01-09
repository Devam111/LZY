
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: { 
      type: String, 
      enum: {
        values: ['student', 'faculty'],
        message: 'Role must be either student or faculty'
      },
      required: [true, 'Role is required']
    },
    // Student specific fields
    studentId: { 
      type: String,
      validate: {
        validator: function(value) {
          // Only validate if role is student
          if (this.role === 'student') {
            return value && value.trim().length > 0;
          }
          return true;
        },
        message: 'Student ID is required for students'
      }
    },
    // Faculty specific fields
    institution: { 
      type: String,
      validate: {
        validator: function(value) {
          // Only validate if role is faculty
          if (this.role === 'faculty') {
            return value && value.trim().length > 0;
          }
          return true;
        },
        message: 'Institution is required for faculty'
      }
    },
    // Common fields
    department: { 
      type: String,
      trim: true
    },
    // Legacy field (keeping for backward compatibility)
    institute: { type: String },
    // Learning related fields
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    progress: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Progress' }],
    streaks: { type: Number, default: 0 },
    achievements: [{ type: String }],
    subscriptionPlan: { type: String, default: 'free' },
    coursesUploaded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    totalStudents: { type: Number, default: 0 },
    // Account status
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    emailVerified: { type: Boolean, default: false }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual fields
userSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    studentId: this.studentId,
    institution: this.institution,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
});

// Indexes for better performance
userSchema.index({ role: 1 });
userSchema.index({ studentId: 1 }, { sparse: true });
userSchema.index({ institution: 1 });

// Pre-save middleware
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save validation
userSchema.pre('save', function(next) {
  // Ensure studentId is unique for students
  if (this.role === 'student' && this.studentId) {
    this.constructor.findOne({ 
      studentId: this.studentId, 
      _id: { $ne: this._id } 
    }).then(existingUser => {
      if (existingUser) {
        next(new Error('Student ID already exists'));
      } else {
        next();
      }
    }).catch(next);
  } else {
    next();
  }
});

// Instance methods
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByStudentId = function(studentId) {
  return this.findOne({ studentId, role: 'student' });
};

userSchema.statics.findByInstitution = function(institution) {
  return this.find({ institution, role: 'faculty' });
};

module.exports = mongoose.model('User', userSchema);


