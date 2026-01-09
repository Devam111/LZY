import { http, withAuth } from './client.js';

// AI Tools API Configuration
const AI_TOOLS_BASE_URL = '/api/ai-tools';

// Helper function to make API requests
const aiToolsRequest = async (endpoint, options = {}) => {
  const config = withAuth({
    method: options.method || 'GET',
    url: `${AI_TOOLS_BASE_URL}${endpoint}`,
    data: options.data,
    ...options
  });
  
  try {
    const response = await http.request(config);
    return response.data;
  } catch (error) {
    console.error('AI Tools API Error:', error);
    throw error;
  }
};

// AI Tools API
export const aiToolsAPI = {
  // Upload file for AI processing
  uploadFile: async (file, fileType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    console.log('Uploading file:', {
      fileName: file.name,
      fileType: fileType,
      fileSize: file.size
    });

    const config = withAuth({
      method: 'POST',
      url: `${AI_TOOLS_BASE_URL}/upload`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    try {
      const response = await http.request(config);
      return response.data;
    } catch (error) {
      console.error('Upload file error:', error);
      // Extract error message from response
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      throw new Error(errorMessage);
    }
  },

  // Get all AI summaries for student
  getMySummaries: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    return aiToolsRequest(queryString ? `/summaries?${queryString}` : '/summaries');
  },

  // Get specific AI summary by ID
  getSummaryById: async (summaryId) => {
    return aiToolsRequest(`/summaries/${summaryId}`);
  },

  // Download original file
  downloadFile: async (summaryId) => {
    const config = withAuth({
      method: 'GET',
      url: `${AI_TOOLS_BASE_URL}/download/${summaryId}`,
      responseType: 'blob', // Important for file downloads
    });

    try {
      const response = await http.request(config);
      return response.data;
    } catch (error) {
      console.error('Download file error:', error);
      throw error;
    }
  },

  // Delete AI summary
  deleteSummary: async (summaryId) => {
    return aiToolsRequest(`/summaries/${summaryId}`, {
      method: 'DELETE'
    });
  },

  // Get AI tools statistics
  getStats: async () => {
    return aiToolsRequest('/stats');
  }
};

export default aiToolsAPI;
