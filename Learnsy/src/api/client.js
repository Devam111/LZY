import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default configuration
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Avoid sending obviously fake local-dev tokens to the backend
    if (token && !token.startsWith('mock-jwt-token-')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    // In local development, don't hard-redirect on 401 to keep the UI usable
    if (status === 401) {
      console.warn('401 from API. Continuing without redirect for local dev.');
    } else if (status === 403) {
      console.error('Access forbidden. Insufficient permissions.');
    } else if (!error.response) {
      console.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

// Helper function to add authentication to requests
export const withAuth = (config) => {
  const token = localStorage.getItem('token');
  
  return {
    ...config,
    headers: {
      ...config.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

// Helper function to handle API errors consistently
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || data?.error || `Server error: ${status}`;
    throw new Error(message);
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('Network error: Unable to connect to server');
  } else {
    // Something else happened
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Utility function to get current user
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Utility function to logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export default http;
