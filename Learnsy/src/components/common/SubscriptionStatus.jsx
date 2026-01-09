import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';

const SubscriptionStatus = ({ showUpgrade = true }) => {
  const { subscription, getPlanName, isFreeTrial, isActive } = useSubscription();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/');
  };

  if (!subscription || !isActive()) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            isFreeTrial() ? 'bg-yellow-400' : 'bg-green-500'
          }`}></div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {getPlanName()} Plan
            </h3>
            <p className="text-sm text-gray-600">
              {isFreeTrial() 
                ? 'Limited access - 3 videos, 2 documents per course'
                : 'Full access to all features'
              }
            </p>
          </div>
        </div>
        
        {isFreeTrial() && showUpgrade && (
          <button
            onClick={handleUpgrade}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Upgrade Now
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
