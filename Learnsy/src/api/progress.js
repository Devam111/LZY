import { http, withAuth } from './client.js';

// Progress API Configuration
const PROGRESS_BASE_URL = '/api/progress';

// Helper function to make API requests
const progressRequest = async (endpoint, options = {}) => {
  const config = withAuth({
    method: options.method || 'GET',
    url: `${PROGRESS_BASE_URL}${endpoint}`,
    data: options.data,
    ...options
  });
  
  try {
    const response = await http.request(config);
    return response.data;
  } catch (error) {
    console.error('Progress API Error:', error);
    throw error;
  }
};

// Progress API
export const progressAPI = {
  // Get student overview with aggregated stats
  getStudentOverview: async () => {
    return progressRequest('/student-overview');
  },

  // Get detailed progress for a specific course
  getCourseProgress: async (courseId) => {
    return progressRequest(`/course/${courseId}`);
  },

  // Update progress for a course
  updateCourseProgress: async (courseId, progressData) => {
    return progressRequest(`/course/${courseId}`, {
      method: 'PUT',
      data: progressData
    });
  },

  // Get study analytics
  getStudyAnalytics: async (timeframe = 'week') => {
    return progressRequest(`/analytics?timeframe=${timeframe}`);
  },

  // Get achievements
  getAchievements: async () => {
    return progressRequest('/achievements');
  },

  // Legacy methods for compatibility
  getCourseAnalytics: async (courseId) => {
    return progressRequest(`/course/${courseId}`);
  },

  getInstructorOverview: async () => {
    return progressRequest('/student-overview');
  },

  getStudentAnalytics: async (studentId) => {
    return progressRequest('/analytics');
  }
};

export default progressAPI;
