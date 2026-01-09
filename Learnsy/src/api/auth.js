import { http, withAuth } from './client.js';

// Auth API Configuration
const AUTH_BASE_URL = '/api/signup'; // Using our dedicated signup backend

// Helper function to make API requests
const authRequest = async (endpoint, options = {}) => {
  const config = withAuth({
    method: options.method || 'GET',
    url: `${AUTH_BASE_URL}${endpoint}`,
    data: options.data,
    ...options
  });
  
  try {
    const response = await http.request(config);
    return response.data;
  } catch (error) {
    console.error('Auth API Error:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      throw new Error(data.message || `Server error: ${status}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Unable to connect to server');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

// Student Authentication API
export const studentAuthAPI = {
  // Register new student
  register: async (studentData) => {
    return authRequest('/student/register', {
      method: 'POST',
      data: studentData
    });
  },

  // Student login
  login: async (credentials) => {
    return authRequest('/student/login', {
      method: 'POST',
      data: credentials
    });
  }
};

// Faculty Authentication API
export const facultyAuthAPI = {
  // Register new faculty
  register: async (facultyData) => {
    return authRequest('/faculty/register', {
      method: 'POST',
      data: facultyData
    });
  },

  // Faculty login
  login: async (credentials) => {
    return authRequest('/faculty/login', {
      method: 'POST',
      data: credentials
    });
  }
};

// User Profile API
export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    return authRequest('/profile');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return authRequest('/profile', {
      method: 'PUT',
      data: profileData
    });
  },

  // Change password
  changePassword: async (passwordData) => {
    return authRequest('/change-password', {
      method: 'POST',
      data: passwordData
    });
  }
};

// Main Auth API - Unified interface
export const authAPI = {
  // Student operations
  student: studentAuthAPI,
  
  // Faculty operations
  faculty: facultyAuthAPI,
  
  // Profile operations
  profile: profileAPI,
  
  // Generic register function that routes based on role
  register: async (userData) => {
    const { role } = userData;
    
    if (role === 'student') {
      return studentAuthAPI.register(userData);
    } else if (role === 'faculty') {
      return facultyAuthAPI.register(userData);
    } else {
      throw new Error('Invalid role. Must be either "student" or "faculty"');
    }
  },
  
  // Generic login function that routes based on role
  login: async (credentials) => {
    const { role } = credentials;
    
    if (role === 'student') {
      return studentAuthAPI.login(credentials);
    } else if (role === 'faculty') {
      return facultyAuthAPI.login(credentials);
    } else {
      throw new Error('Invalid role. Must be either "student" or "faculty"');
    }
  },

  // Profile functions (for backward compatibility)
  getProfile: async () => {
    return profileAPI.getProfile();
  },

  updateProfile: async (profileData) => {
    return profileAPI.updateProfile(profileData);
  },

  changePassword: async (passwordData) => {
    return profileAPI.changePassword(passwordData);
  }
};

export default authAPI;
