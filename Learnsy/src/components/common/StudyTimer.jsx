import React, { useState, useEffect, useCallback, useRef } from 'react';
import { studySessionAPI } from '../../api/studySession.js';

const StudyTimer = ({ courseId, onSessionUpdate }) => {
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Check for existing active session on mount
  useEffect(() => {
    checkActiveSession();
    
    // Set up activity tracking
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (session && isActive) {
        updateSessionActivity('browsing');
      }
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check for idle time every 30 seconds
    const idleCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // If user has been idle for more than 5 minutes, mark as idle
      if (timeSinceLastActivity > 5 * 60 * 1000 && session && isActive) {
        updateSessionActivity('idle');
      }
    }, 30000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(idleCheckInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, isActive]);

  // Check for active session
  const checkActiveSession = async () => {
    try {
      const response = await studySessionAPI.getActiveSession();
      if (response.success && response.session) {
        setSession(response.session);
        setIsActive(true);
        setDuration(response.session.currentDuration);
        startTimer();
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  // Start study session
  const startSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const deviceInfo = {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        browser: getBrowserName()
      };

      const response = await studySessionAPI.startSession({
        courseId,
        activity: 'browsing',
        deviceInfo
      });

      if (response.success) {
        setSession(response.session);
        setIsActive(true);
        setDuration(0);
        startTimer();
        onSessionUpdate?.('started', response.session);
      } else {
        setError(response.message || 'Failed to start study session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setError('Failed to start study session');
    } finally {
      setIsLoading(false);
    }
  };

  // End study session
  const endSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session) return;

      const response = await studySessionAPI.endSession(session.id);
      if (response.success) {
        setIsActive(false);
        setSession(null);
        setDuration(0);
        stopTimer();
        onSessionUpdate?.('ended', response.session);
      } else {
        setError(response.message || 'Failed to end study session');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end study session');
    } finally {
      setIsLoading(false);
    }
  };

  // Update session activity
  const updateSessionActivity = async (activity, additionalData = {}) => {
    try {
      if (!session) return;

      await studySessionAPI.updateSession(session.id, {
        activity,
        additionalData
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  };

  // Start timer
  const startTimer = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 60000); // Update every minute
  };

  // Stop timer
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Format time
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Get browser name
  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  // Handle lesson completion
  const handleLessonCompleted = () => {
    if (session && isActive) {
      updateSessionActivity('reading', { lessonCompleted: true });
    }
  };

  // Handle quiz completion
  const handleQuizCompleted = (score) => {
    if (session && isActive) {
      updateSessionActivity('quiz', { 
        quizResult: { 
          score, 
          completedAt: new Date() 
        } 
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Study Timer</h3>
        {session && (
          <span className="text-sm text-gray-500">
            Session: {session.id.slice(-8)}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-purple-600 mb-2">
          {formatTime(duration)}
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          {isActive ? 'Study session active' : 'No active session'}
        </div>

        <div className="flex justify-center space-x-4">
          {!isActive ? (
            <button
              onClick={startSession}
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Start Study Session'}
            </button>
          ) : (
            <button
              onClick={endSession}
              disabled={isLoading}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Ending...' : 'End Session'}
            </button>
          )}
        </div>

        {session && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Activity: <span className="font-medium">{session.activity}</span></p>
            <p>Lessons completed: <span className="font-medium">{session.lessonsCompleted || 0}</span></p>
            <p>Started: <span className="font-medium">{new Date(session.startTime).toLocaleTimeString()}</span></p>
          </div>
        )}
      </div>

      {/* Activity buttons for manual tracking */}
      {isActive && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateSessionActivity('reading')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Reading
            </button>
            <button
              onClick={() => updateSessionActivity('watching')}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              Watching
            </button>
            <button
              onClick={handleLessonCompleted}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Lesson Complete
            </button>
            <button
              onClick={() => updateSessionActivity('quiz')}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
            >
              Taking Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyTimer;
