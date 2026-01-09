import { http, withAuth } from './client.js';

// Enrollments API Configuration
const ENROLLMENTS_BASE_URL = '/api/enrollments';

// Helper function to make API requests
const enrollmentsRequest = async (endpoint, options = {}) => {
  const config = withAuth({
    method: options.method || 'GET',
    url: `${ENROLLMENTS_BASE_URL}${endpoint}`,
    data: options.data,
    ...options
  });
  
  try {
    const response = await http.request(config);
    return response.data;
  } catch (error) {
    console.error('Enrollments API Error:', error);
    throw error;
  }
};

// Enrollments API
export const enrollmentsAPI = {
  // Enroll in a course
  enroll: async (courseId) => {
    return enrollmentsRequest('', {
      method: 'POST',
      data: { courseId }
    });
  },

  // Get my enrollments
  getMyEnrollments: async () => {
    return enrollmentsRequest('/my-enrollments');
  },

  // Get enrollment by ID
  getById: async (enrollmentId) => {
    return enrollmentsRequest(`/${enrollmentId}`);
  },

  // Update enrollment progress
  updateProgress: async (enrollmentId, progressData) => {
    return enrollmentsRequest(`/${enrollmentId}/progress`, {
      method: 'PUT',
      data: progressData
    });
  },

  // Drop enrollment
  drop: async (enrollmentId) => {
    return enrollmentsRequest(`/${enrollmentId}`, {
      method: 'DELETE'
    });
  },

  // Get course enrollments (for faculty)
  getCourseEnrollments: async (courseId) => {
    return enrollmentsRequest(`/course/${courseId}`);
  }
};

export default enrollmentsAPI;
