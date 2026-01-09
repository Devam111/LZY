import { http, withAuth } from './client.js';

// Study Session API Configuration
const STUDY_SESSION_BASE_URL = '/api/study-sessions';

// Helper function to make API requests
const studySessionRequest = async (endpoint, options = {}) => {
  const config = withAuth({
    method: options.method || 'GET',
    url: `${STUDY_SESSION_BASE_URL}${endpoint}`,
    data: options.data,
    ...options
  });
  
  try {
    const response = await http.request(config);
    return response.data;
  } catch (error) {
    console.error('Study Session API Error:', error);
    throw error;
  }
};

// Study Session API
export const studySessionAPI = {
  // Start a new study session
  startSession: async (sessionData) => {
    return studySessionRequest('/start', {
      method: 'POST',
      data: sessionData
    });
  },

  // Update study session activity
  updateSession: async (sessionId, updateData) => {
    return studySessionRequest(`/${sessionId}/update`, {
      method: 'PUT',
      data: updateData
    });
  },

  // End study session
  endSession: async (sessionId) => {
    return studySessionRequest(`/${sessionId}/end`, {
      method: 'PUT'
    });
  },

  // Get active study session
  getActiveSession: async () => {
    return studySessionRequest('/active');
  },

  // Get study session history
  getSessionHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return studySessionRequest(`/history?${queryString}`);
  },

  // Get live study statistics
  getLiveStats: async () => {
    return studySessionRequest('/stats');
  }
};

export default studySessionAPI;