const SignupUser = require('../models/SignupUser');
const { createToken } = require('../config/jwt');
const crypto = require('crypto');

// Student Registration
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, studentId, department } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, password, and student ID are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await SignupUser.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }
    
    // Check if student ID already exists
    const existingStudent = await SignupUser.findByStudentId(studentId);
    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID already exists' 
      });
    }

    // Create new student
    const studentData = { 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password, 
      studentId: studentId.trim(), 
      department: department ? department.trim() : undefined,
      role: 'student',
      signupSource: 'web',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    const student = await SignupUser.create(studentData);
    
    // Generate JWT token
    const token = createToken({ 
      id: student._id, 
      role: student.role,
      email: student.email 
    });
    
    // Generate email verification token
    await student.generateEmailVerificationToken();
    
    // Return student without password
    const studentResponse = student.toSafeObject();
    
    return res.status(201).json({ 
      success: true, 
      user: studentResponse, 
      token,
      message: 'Student account created successfully',
      emailVerificationRequired: true
    });
  } catch (error) {
    console.error('Student registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field} already exists` 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration' 
    });
  }
};

// Faculty Registration
const registerFaculty = async (req, res) => {
  try {
    const { name, email, password, institution, department } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !institution) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, password, and institution are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await SignupUser.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Create new faculty
    const facultyData = { 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password, 
      institution: institution.trim(), 
      department: department ? department.trim() : undefined,
      role: 'faculty',
      signupSource: 'web',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    const faculty = await SignupUser.create(facultyData);
    
    // Generate JWT token
    const token = createToken({ 
      id: faculty._id, 
      role: faculty.role,
      email: faculty.email 
    });
    
    // Generate email verification token
    await faculty.generateEmailVerificationToken();
    
    // Return faculty without password
    const facultyResponse = faculty.toSafeObject();
    
    return res.status(201).json({ 
      success: true, 
      user: facultyResponse, 
      token,
      message: 'Faculty account created successfully',
      emailVerificationRequired: true
    });
  } catch (error) {
    console.error('Faculty registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field} already exists` 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration' 
    });
  }
};

// Student Login
const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    const student = await SignupUser.findOne({ 
      email: email.toLowerCase(), 
      role: 'student' 
    });
    
    if (!student) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Update last login
    await student.updateLastLogin();
    
    // Generate JWT token
    const token = createToken({ 
      id: student._id, 
      role: student.role,
      email: student.email 
    });
    
    const studentResponse = student.toSafeObject();
    
    return res.json({ 
      success: true, 
      user: studentResponse, 
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Student login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login' 
    });
  }
};

// Faculty Login
const loginFaculty = async (req, res) => {
  try {
    const { email, password, institution } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    const faculty = await SignupUser.findOne({ 
      email: email.toLowerCase(), 
      role: 'faculty',
      ...(institution && { institution })
    });
    
    if (!faculty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const isPasswordValid = await faculty.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Update last login
    await faculty.updateLastLogin();
    
    // Generate JWT token
    const token = createToken({ 
      id: faculty._id, 
      role: faculty.role,
      email: faculty.email 
    });
    
    const facultyResponse = faculty.toSafeObject();
    
    return res.json({ 
      success: true, 
      user: facultyResponse, 
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Faculty login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login' 
    });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await SignupUser.findById(req.user.id).select('-password -emailVerificationToken');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      user: user.toSafeObject() 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const { name, department, institution, studentId } = req.body;
    const userId = req.user.id;
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (department) updateData.department = department.trim();
    if (institution) updateData.institution = institution.trim();
    if (studentId) updateData.studentId = studentId.trim();
    
    const user = await SignupUser.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      user: user.toSafeObject(),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get Signup Statistics
const getSignupStats = async (req, res) => {
  try {
    const stats = await SignupUser.getSignupStats();
    const totalUsers = await SignupUser.countDocuments();
    const activeUsers = await SignupUser.countDocuments({ isActive: true });
    const verifiedUsers = await SignupUser.countDocuments({ isEmailVerified: true });
    
    return res.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        byRole: stats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  registerStudent,
  registerFaculty,
  loginStudent,
  loginFaculty,
  getUserProfile,
  updateProfile,
  getSignupStats
};
