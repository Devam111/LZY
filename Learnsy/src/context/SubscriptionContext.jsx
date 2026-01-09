import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionAPI } from '../api/subscription';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Fetch current subscription
  const fetchSubscription = async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await subscriptionAPI.getCurrentSubscription();
      setSubscription(response.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Set default free subscription on error
      setSubscription({
        plan: 'free',
        status: 'active',
        features: {
          fullCourseAccess: false,
          aiTools: false,
          notesAccess: false,
          progressTracking: true,
          videoLimit: 3,
          documentLimit: 2
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user has access to a specific feature
  const hasAccess = (feature) => {
    if (!subscription) return false;
    return subscription.features[feature] === true;
  };

  // Check if user can access a specific video
  const canAccessVideo = (videoIndex) => {
    if (!subscription) return videoIndex < 3; // Free trial limit
    
    if (subscription.features.videoLimit === -1) {
      return true; // Unlimited access
    }
    
    return videoIndex < subscription.features.videoLimit;
  };

  // Check if user can access a specific document
  const canAccessDocument = (documentIndex) => {
    if (!subscription) return documentIndex < 2; // Free trial limit
    
    if (subscription.features.documentLimit === -1) {
      return true; // Unlimited access
    }
    
    return documentIndex < subscription.features.documentLimit;
  };

  // Check if subscription is active
  const isActive = () => {
    if (!subscription) return true; // Free trial is always "active"
    return subscription.status === 'active' && 
           (!subscription.endDate || new Date(subscription.endDate) > new Date());
  };

  // Get subscription plan name
  const getPlanName = () => {
    if (!subscription) return 'Free Trial';
    return subscription.plan;
  };

  // Check if user is on free trial
  const isFreeTrial = () => {
    return !subscription || subscription.plan === 'free';
  };

  // Update subscription after successful payment
  const updateSubscription = (newSubscription) => {
    setSubscription(newSubscription);
  };

  // Refresh subscription data
  const refreshSubscription = () => {
    fetchSubscription();
  };

  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated, user]);

  const value = {
    subscription,
    loading,
    hasAccess,
    canAccessVideo,
    canAccessDocument,
    isActive,
    getPlanName,
    isFreeTrial,
    updateSubscription,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
