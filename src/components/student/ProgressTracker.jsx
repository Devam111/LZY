import React, { useState } from 'react';

const ProgressTracker = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedCourse, setSelectedCourse] = useState('all');

  const [courses] = useState([
    { id: 'all', name: 'All Courses' },
    { id: 1, name: 'Introduction to React' },
    { id: 2, name: 'Advanced JavaScript' },
    { id: 3, name: 'Web Development Fundamentals' }
  ]);

  const [progressData] = useState({
    week: {
      studyTime: [2, 3, 1.5, 4, 2.5, 3.5, 2],
      lessonsCompleted: [3, 5, 2, 6, 4, 7, 3],
      quizzesTaken: [2, 3, 1, 4, 2, 3, 1]
    },
    month: {
      studyTime: [8, 12, 10, 15, 9, 11, 13, 7, 14, 12, 9, 11, 10, 13, 8, 12, 15, 9, 11, 13, 10, 12, 8, 14, 11, 9, 13, 12, 10, 15],
      lessonsCompleted: [12, 18, 15, 22, 14, 19, 21, 11, 24, 20, 16, 18, 17, 22, 13, 19, 25, 15, 18, 21, 17, 20, 14, 23, 19, 16, 22, 20, 18, 24],
      quizzesTaken: [8, 12, 10, 15, 9, 11, 13, 7, 14, 12, 9, 11, 10, 13, 8, 12, 15, 9, 11, 13, 10, 12, 8, 14, 11, 9, 13, 12, 10, 15]
    }
  });

  const [achievements] = useState([
    { id: 1, title: 'First Lesson', description: 'Completed your first lesson', icon: '🎯', unlocked: true, date: '2024-01-10' },
    { id: 2, title: 'Week Warrior', description: 'Studied for 7 consecutive days', icon: '🔥', unlocked: true, date: '2024-01-15' },
    { id: 3, title: 'Quiz Master', description: 'Scored 100% on 5 quizzes', icon: '🏆', unlocked: false },
    { id: 4, title: 'Course Completer', description: 'Completed your first course', icon: '🎓', unlocked: false },
    { id: 5, title: 'AI Explorer', description: 'Used all AI tools available', icon: '🤖', unlocked: true, date: '2024-01-12' },
    { id: 6, title: 'Revision Champion', description: 'Completed 10 revision sessions', icon: '📚', unlocked: false }
  ]);

  const [learningStreak] = useState({
    currentStreak: 7,
    longestStreak: 12,
    totalStudyDays: 45,
    averageStudyTime: 2.3
  });

  const [topicProgress] = useState([
    { topic: 'React Components', progress: 85, lessons: 8, completed: 7 },
    { topic: 'React Hooks', progress: 60, lessons: 10, completed: 6 },
    { topic: 'JavaScript ES6', progress: 90, lessons: 12, completed: 11 },
    { topic: 'Async/Await', progress: 45, lessons: 8, completed: 4 },
    { topic: 'CSS Grid', progress: 75, lessons: 6, completed: 5 },
    { topic: 'Responsive Design', progress: 30, lessons: 10, completed: 3 }
  ]);

  const getAverageStudyTime = () => {
    const data = progressData[selectedTimeframe].studyTime;
    return (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
  };

  const getTotalLessonsCompleted = () => {
    const data = progressData[selectedTimeframe].lessonsCompleted;
    return data.reduce((a, b) => a + b, 0);
  };

  const getTotalQuizzesTaken = () => {
    const data = progressData[selectedTimeframe].quizzesTaken;
    return data.reduce((a, b) => a + b, 0);
  };

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
            <p className="text-2xl font-bold text-yellow-600">{learningStreak.averageStudyTime}h</p>
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
            <div key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{topic.topic}</h4>
                  <p className="text-sm text-gray-500">{topic.completed}/{topic.lessons} lessons</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{topic.progress}%</p>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${topic.progress}%` }}
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
                    {achievement.unlocked && achievement.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Unlocked: {new Date(achievement.date).toLocaleDateString()}
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
