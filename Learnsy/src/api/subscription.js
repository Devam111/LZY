import { http } from './client.js';

export const subscriptionAPI = {
  // Get user's current subscription
  getCurrentSubscription: async () => {
    try {
      const response = await http.get('/subscriptions/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      throw error;
    }
  },

  // Process payment for subscription
  processPayment: async (paymentData) => {
    try {
      const response = await http.post('/subscriptions/process-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  // Get subscription plans
  getPlans: async () => {
    try {
      const response = await http.get('/subscriptions/plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async () => {
    try {
      const response = await http.post('/subscriptions/cancel');
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  // Check if user has access to premium features
  checkAccess: async (feature) => {
    try {
      const response = await http.get(`/subscriptions/check-access/${feature}`);
      return response.data;
    } catch (error) {
      console.error('Error checking access:', error);
      throw error;
    }
  }
};
