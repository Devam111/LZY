const SignupUser = require('../models/SignupUser');
const { createToken } = require('../config/jwt');

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
const me = async (req, res) => {
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

module.exports = { loginStudent, loginFaculty, me };


