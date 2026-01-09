import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to make authenticated requests
const materialRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await axios(`${API_BASE_URL}/materials${endpoint}`, config);
    return response.data;
  } catch (error) {
    console.error('Material API Error:', error);
    throw error.response?.data || { message: 'Network error' };
  }
};

export const materialsAPI = {
  // Get all materials for a course (students)
  getCourseMaterials: async (courseId) => {
    return materialRequest(`/course/${courseId}`);
  },

  // Get all materials for a course (faculty)
  getFacultyCourseMaterials: async (courseId) => {
    return materialRequest(`/faculty/course/${courseId}`);
  },

  // Get material details
  getMaterialDetails: async (materialId) => {
    return materialRequest(`/${materialId}`);
  },

  // Mark material as completed (toggle)
  markMaterialCompleted: async (materialId, completed = true) => {
    return materialRequest(`/${materialId}/complete`, { 
      method: 'POST',
      data: { completed }
    });
  },

  // Get completed materials for a course
  getCompletedMaterials: async (courseId) => {
    return materialRequest(`/course/${courseId}/completed`);
  },

  // Create material (faculty only)
  createMaterial: async (materialData) => {
    return materialRequest('', { 
      method: 'POST', 
      data: materialData 
    });
  },

  // Update material (faculty only)
  updateMaterial: async (materialId, materialData) => {
    return materialRequest(`/${materialId}`, { 
      method: 'PUT', 
      data: materialData 
    });
  },

  // Delete material (faculty only)
  deleteMaterial: async (materialId) => {
    return materialRequest(`/${materialId}`, { method: 'DELETE' });
  },

  // Upload material with file (faculty only)
  upload: async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/materials`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Material Upload Error:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  }
};