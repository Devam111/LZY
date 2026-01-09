import React, { useState, useEffect, useCallback } from 'react';
import { studySessionAPI } from '../../api/studySession.js';

const LiveStats = () => {
  const [stats, setStats] = useState({
    activeSession: null,
    todayStats: {
      totalTime: 0,
      activeTime: 0,
      sessionsCount: 0,
      lessonsCompleted: 0
    },
    weeklyStats: {
      totalTime: 0,
      sessionsCount: 0,
      lessonsCompleted: 0,
      averageSessionTime: 0
    },
    currentStreak: 0,
    longestStreak: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load live stats
  const loadLiveStats = useCallback(async () => {
    try {
      const response = await studySessionAPI.getLiveStats();
      if (response.success) {
        setStats(response);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading live stats:', error);
      setError('Failed to load live statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load stats on mount and set up auto-refresh
  useEffect(() => {
    loadLiveStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadLiveStats, 30000);
    
    return () => clearInterval(interval);
  }, [loadLiveStats]);

  // Format time in hours and minutes
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Format percentage
  const formatPercentage = (value, total) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={loadLiveStats}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Session */}
      {stats.activeSession && (
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Active Study Session</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">Duration</p>
              <p className="text-2xl font-bold">{formatTime(stats.activeSession.currentDuration)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Activity</p>
              <p className="text-lg font-semibold capitalize">{stats.activeSession.activity}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Course</p>
              <p className="text-lg font-semibold">{stats.activeSession.course?.title || 'General'}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Lessons</p>
              <p className="text-2xl font-bold">{stats.activeSession.lessonsCompleted || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Progress</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(stats.todayStats.totalTime)}</div>
            <div className="text-sm text-gray-500">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatTime(stats.todayStats.activeTime)}</div>
            <div className="text-sm text-gray-500">Active Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.todayStats.sessionsCount}</div>
            <div className="text-sm text-gray-500">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.todayStats.lessonsCompleted}</div>
            <div className="text-sm text-gray-500">Lessons</div>
          </div>
        </div>

        {/* Focus percentage */}
        {stats.todayStats.totalTime > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Focus Rate</span>
              <span>{formatPercentage(stats.todayStats.activeTime, stats.todayStats.totalTime)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: formatPercentage(stats.todayStats.activeTime, stats.todayStats.totalTime) }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">This Week</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(stats.weeklyStats.totalTime)}</div>
            <div className="text-sm text-gray-500">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.weeklyStats.sessionsCount}</div>
            <div className="text-sm text-gray-500">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.weeklyStats.lessonsCompleted}</div>
            <div className="text-sm text-gray-500">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatTime(stats.weeklyStats.averageSessionTime)}</div>
            <div className="text-sm text-gray-500">Avg Session</div>
          </div>
        </div>
      </div>

      {/* Streak Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Study Streak</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.currentStreak}</div>
            <div className="text-sm text-gray-500">Current Streak</div>
            <div className="text-xs text-gray-400">days</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.longestStreak}</div>
            <div className="text-sm text-gray-500">Longest Streak</div>
            <div className="text-xs text-gray-400">days</div>
          </div>
        </div>

        {/* Streak visualization */}
        <div className="mt-4">
          <div className="flex justify-center space-x-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < stats.currentStreak 
                    ? 'bg-orange-500' 
                    : 'bg-gray-200'
                }`}
                title={`Day ${i + 1}`}
              ></div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            Last 7 days
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;
