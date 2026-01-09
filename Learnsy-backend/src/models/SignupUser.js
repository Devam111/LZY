const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Dedicated Signup User Schema
const signupUserSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    maxlength: [255, 'Email cannot exceed 255 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    maxlength: [128, 'Password cannot exceed 128 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['student', 'faculty'],
      message: 'Role must be either student or faculty'
    }
  },
  
  // Student specific fields
  studentId: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values but unique when not null
    validate: {
      validator: function(value) {
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
    trim: true,
    maxlength: [200, 'Institution name cannot exceed 200 characters'],
    validate: {
      validator: function(value) {
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
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date
  },
  
  // Signup metadata
  signupSource: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  
  // Learning related fields
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  progress: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Progress'
  }],
  streaks: {
    type: Number,
    default: 0
  },
  achievements: [{
    type: String
  }],
  subscriptionPlan: {
    type: String,
    default: 'free'
  },
  coursesUploaded: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  totalStudents: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'signupusers'
});

// Indexes for better performance
signupUserSchema.index({ email: 1 });
signupUserSchema.index({ role: 1 });
signupUserSchema.index({ studentId: 1 }, { sparse: true });
signupUserSchema.index({ institution: 1 });
signupUserSchema.index({ isActive: 1 });
signupUserSchema.index({ createdAt: -1 });

// Virtual fields
signupUserSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    studentId: this.studentId,
    institution: this.institution,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt
  };
});

// Pre-save middleware for password hashing
signupUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save validation for unique student ID
signupUserSchema.pre('save', function(next) {
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
signupUserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

signupUserSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  return userObject;
};

signupUserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

signupUserSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  return this.save();
};

// Static methods
signupUserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

signupUserSchema.statics.findByStudentId = function(studentId) {
  return this.findOne({ studentId, role: 'student' });
};

signupUserSchema.statics.findByInstitution = function(institution) {
  return this.find({ institution, role: 'faculty' });
};

signupUserSchema.statics.getSignupStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('SignupUser', signupUserSchema);
