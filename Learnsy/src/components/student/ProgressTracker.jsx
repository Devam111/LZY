import React, { useState, useEffect } from 'react';
import { progressAPI } from '../../api/progress.js';
import { formatStudyTime, calculateAvgStudyTimePerDay } from '../../utils/timeFormatter.js';

const ProgressTracker = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real data states
  const [courses, setCourses] = useState([
    { id: 'all', name: 'All Courses' }
  ]);
  const [progressData, setProgressData] = useState({
    week: { studyTime: [], lessonsCompleted: [], quizzesTaken: [] },
    month: { studyTime: [], lessonsCompleted: [], quizzesTaken: [] }
  });
  const [achievements, setAchievements] = useState([]);
  const [learningStreak, setLearningStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalStudyDays: 0,
    averageStudyTime: 0
  });
  const [topicProgress, setTopicProgress] = useState([]);

  // Load real data
  useEffect(() => {
    const loadProgressData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load study analytics
        const analyticsResponse = await progressAPI.getStudyAnalytics(selectedTimeframe);
        if (analyticsResponse.success) {
          setProgressData({
            [selectedTimeframe]: {
              studyTime: analyticsResponse.data.studyTime,
              lessonsCompleted: analyticsResponse.data.lessonsCompleted,
              quizzesTaken: [] // Not available in current API
            }
          });
        }

        // Load achievements
        const achievementsResponse = await progressAPI.getAchievements();
        if (achievementsResponse.success) {
          setAchievements(achievementsResponse.achievements);
        }

        // Load student overview for streak data
        const overviewResponse = await progressAPI.getStudentOverview();
        if (overviewResponse.success) {
          const avgStudyTime = overviewResponse.avgStudyTimePerDay || 
            (overviewResponse.studyTimeMinutes && overviewResponse.totalStudyDays ? 
              calculateAvgStudyTimePerDay(overviewResponse.studyTimeMinutes, overviewResponse.totalStudyDays) : 0);
          
          setLearningStreak({
            currentStreak: overviewResponse.currentStreak || 0,
            longestStreak: overviewResponse.longestStreak || 0,
            totalStudyDays: overviewResponse.totalStudyDays || 0,
            averageStudyTime: avgStudyTime
          });
        }

      } catch (error) {
        console.error('Error loading progress data:', error);
        setError('Failed to load progress data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [selectedTimeframe]);

  const getAverageStudyTime = () => {
    const data = progressData[selectedTimeframe].studyTime;
    if (!data || data.length === 0) return '0.0';
    const totalMinutes = data.reduce((a, b) => a + b, 0);
    const avgMinutes = totalMinutes / data.length;
    return formatStudyTime(avgMinutes).replace('h', '');
  };

  const getTotalLessonsCompleted = () => {
    const data = progressData[selectedTimeframe].lessonsCompleted;
    return data.reduce((a, b) => a + b, 0);
  };

  const getTotalQuizzesTaken = () => {
    const data = progressData[selectedTimeframe].quizzesTaken;
    return data.reduce((a, b) => a + b, 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading progress data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Progress</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Tracker</h2>
          <p className="text-gray-600">Monitor your learning progress and achievements</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Study Time</p>
              <p className="text-2xl font-bold text-gray-900">{getAverageStudyTime()}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalLessonsCompleted()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quizzes Taken</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalQuizzesTaken()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Learning Streak</p>
              <p className="text-2xl font-bold text-gray-900">{learningStreak.currentStreak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Streak */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Streak</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{learningStreak.currentStreak}</p>
            <p className="text-sm text-gray-600">Current Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{learningStreak.longestStreak}</p>
            <p className="text-sm text-gray-600">Longest Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{learningStreak.totalStudyDays}</p>
            <p className="text-sm text-gray-600">Total Study Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{learningStreak.averageStudyTime.toFixed(1)}h</p>
            <p className="text-sm text-gray-600">Avg Study Time</p>
          </div>
        </div>
      </div>

      {/* Topic Progress */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Topic Progress</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {topicProgress.map((topic, index) => (
            <div key={topic.topic || `topic-${index}`} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{topic.topic}</h4>
                  <p className="text-sm text-gray-500">{topic.completed}/{topic.lessons} lessons</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{Math.min(topic.progress || 0, 100)}%</p>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(topic.progress || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Achievements</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`p-4 rounded-lg border-2 ${
                  achievement.unlocked 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${
                      achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {achievement.description}
                    </p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <div className="text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Study Calendar */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Study Calendar</h3>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const hasStudied = Math.random() > 0.3; // Simulate study data
            return (
              <div
                key={i}
                className={`aspect-square rounded border-2 flex items-center justify-center text-xs ${
                  hasStudied 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Studied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
            <span>No Study</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
