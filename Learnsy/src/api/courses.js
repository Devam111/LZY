import { http, withAuth } from './client.js';

// Courses API Configuration
const COURSES_BASE_URL = '/api/courses';

// Helper function to make API requests
const coursesRequest = async (endpoint, options = {}) => {
  const config = withAuth({
    method: options.method || 'GET',
    url: `${COURSES_BASE_URL}${endpoint}`,
    data: options.data,
    ...options
  });
  
  try {
    const response = await http.request(config);
    return response.data;
  } catch (error) {
    console.error('Courses API Error:', error);
    throw error;
  }
};

// Courses API
export const coursesAPI = {
  // Get all courses with filtering
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    return coursesRequest(queryString ? `?${queryString}` : '');
  },

  // Get course by ID
  getById: async (courseId) => {
    return coursesRequest(`/${courseId}`);
  },

  // Create new course
  create: async (courseData) => {
    return coursesRequest('', {
      method: 'POST',
      data: courseData
    });
  },

  // Update course
  update: async (courseId, courseData) => {
    return coursesRequest(`/${courseId}`, {
      method: 'PUT',
      data: courseData
    });
  },

  // Delete course
  delete: async (courseId) => {
    return coursesRequest(`/${courseId}`, {
      method: 'DELETE'
    });
  },

  // Get my courses (for faculty)
  getMyCourses: async () => {
    return coursesRequest('/my-courses');
  },

  // Toggle course publish status
  togglePublish: async (courseId) => {
    return coursesRequest(`/${courseId}/publish`, {
      method: 'POST'
    });
  }
};

export default coursesAPI;
