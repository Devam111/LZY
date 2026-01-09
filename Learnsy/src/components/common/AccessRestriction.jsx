import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../context/SimpleSubscriptionContext';

const AccessRestriction = ({ 
  feature, 
  message, 
  showUpgrade = true,
  className = "" 
}) => {
  const { isFreeTrial } = useSubscription();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/');
  };

  if (!isFreeTrial()) {
    return null;
  }

  const getFeatureMessage = () => {
    switch (feature) {
      case 'ai-tools':
        return 'AI-powered learning tools are available with a paid subscription.';
      case 'notes':
        return 'Note-taking feature is available with a paid subscription.';
      case 'full-course':
        return 'Full course access is available with a paid subscription.';
      case 'video':
        return 'You can only access the first 3 videos per course with the free trial.';
      case 'document':
        return 'You can only access the first 2 documents per course with the free trial.';
      default:
        return message || 'This feature requires a paid subscription.';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 text-center ${className}`}>
      <div className="mb-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Premium Feature
        </h3>
        <p className="text-gray-600 mb-4">
          {getFeatureMessage()}
        </p>
      </div>
      
      {showUpgrade && (
        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Upgrade to Premium
          </button>
          <p className="text-xs text-gray-500">
            Starting from ₹149/month • Cancel anytime
          </p>
        </div>
      )}
    </div>
  );
};

export default AccessRestriction;
