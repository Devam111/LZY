import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProgressTracker from './ProgressTracker';
import RevisionTool from './RevisionTool';
import { coursesAPI, enrollmentsAPI, materialsAPI } from '../../api/index.js';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [revisionReminders, setRevisionReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const userName = user?.name || 'Student';

  // Check authentication on component mount
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, authLoading, navigate]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load available courses
      const coursesResponse = await coursesAPI.getAll();
      if (coursesResponse && coursesResponse.success) {
        setAvailableCourses(coursesResponse.courses || []);
      } else {
        setAvailableCourses([]);
      }
      
      // Load enrolled courses
      const enrollmentsResponse = await enrollmentsAPI.getMyEnrollments();
      if (enrollmentsResponse && enrollmentsResponse.success) {
        setEnrolledCourses(enrollmentsResponse.enrollments || []);
      } else {
        setEnrolledCourses([]);
      }
      
      // Load recent materials from enrolled courses
      const materials = [];
      if (enrollmentsResponse && enrollmentsResponse.success && enrollmentsResponse.enrollments) {
        for (const enrollment of enrollmentsResponse.enrollments) {
          try {
            const courseMaterials = await materialsAPI.getCourseMaterials(enrollment.courseId || enrollment.course);
            if (courseMaterials && courseMaterials.success && courseMaterials.materials) {
              materials.push(...courseMaterials.materials);
            }
          } catch (materialError) {
            console.warn('Failed to load materials for course:', enrollment.courseId || enrollment.course, materialError);
          }
        }
      }
      setRecentMaterials(materials.slice(0, 5)); // Show last 5 materials
      
      // Generate revision reminders based on enrolled courses
      const reminders = [];
      if (enrollmentsResponse && enrollmentsResponse.success && enrollmentsResponse.enrollments) {
        for (const enrollment of enrollmentsResponse.enrollments) {
          const course = enrollment.course;
          if (course && course.modules && course.modules.length > 0) {
            const lastModule = course.modules[course.modules.length - 1];
            reminders.push({
              id: course._id || course.id,
              topic: lastModule.title,
              daysLeft: Math.floor(Math.random() * 10) + 1,
              course: course.title
            });
          }
        }
      }
      setRevisionReminders(reminders.slice(0, 3));
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLearning = () => {
    // Navigate to the first course or show course selection
    if (enrolledCourses.length > 0) {
      const firstCourse = enrolledCourses[0];
      navigate(`/course/${firstCourse.course._id || firstCourse.course}`);
    } else if (availableCourses.length > 0) {
      // If not enrolled in any courses, show available courses
      navigate('/');
    }
  };

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleViewMaterial = (materialId) => {
    // In a real app, this would open the material viewer
    alert(`Opening material: ${materialId}. This would open the material viewer in a real application.`);
  };

  const handleReviseTopic = (topic, course) => {
    // In a real app, this would open the revision tool for the specific topic
    alert(`Starting revision for ${topic} in ${course}. This would open the revision tool in a real application.`);
  };

  const handleEnrollInCourse = async (courseId) => {
    try {
      await enrollmentsAPI.enroll(courseId);
      await loadDashboardData(); // Reload data after enrollment
      alert('Successfully enrolled in course!');
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll in course. Please try again.');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h2>
        <p className="text-purple-100">Continue your learning journey with personalized recommendations</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(enrolledCourses.reduce((acc, course) => acc + course.progress, 0) / enrolledCourses.length)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Study Time</p>
              <p className="text-2xl font-bold text-gray-900">2.5h</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrolledCourses.reduce((acc, course) => acc + course.completedLessons, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

             {/* Enrolled Courses */}
       <div className="bg-white rounded-lg shadow-sm border">
         <div className="px-6 py-4 border-b border-gray-200">
           <h3 className="text-lg font-medium text-gray-900">Your Courses</h3>
         </div>
         <div className="divide-y divide-gray-200">
           {enrolledCourses.length > 0 ? (
             enrolledCourses.map((enrollment) => {
               const course = enrollment.course;
               return (
                 <div key={enrollment._id || enrollment.id} className="px-6 py-4">
                   <div className="flex items-center justify-between">
                     <div className="flex-1">
                       <h4 className="text-lg font-medium text-gray-900">{course.title}</h4>
                       <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                         <span>Progress: {enrollment.progress || 0}%</span>
                         <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                         <span>Status: {enrollment.status || 'active'}</span>
                       </div>
                       <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                         <div 
                           className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                           style={{ width: `${enrollment.progress || 0}%` }}
                         ></div>
                       </div>
                     </div>
                     <div className="ml-6">
                       <button
                         onClick={() => handleViewCourse(course._id || course.id)}
                         className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                       >
                         Continue
                       </button>
                     </div>
                   </div>
                 </div>
               );
             })
           ) : (
             <div className="px-6 py-8 text-center">
               <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
               <button
                 onClick={() => navigate('/')}
                 className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
               >
                 Browse Available Courses
               </button>
             </div>
           )}
         </div>
       </div>

      {/* Recent Materials */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Materials</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentMaterials.map((material) => (
            <div key={material.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{material.title}</h4>
                  <p className="text-xs text-gray-500">{material.course}</p>
                  {material.duration && (
                    <p className="text-xs text-gray-400">Duration: {material.duration}</p>
                  )}
                  {material.pages && (
                    <p className="text-xs text-gray-400">Pages: {material.pages}</p>
                  )}
                </div>
                <button 
                  onClick={() => handleViewMaterial(material.id)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revision Reminders */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Revision Reminders</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {revisionReminders.map((reminder) => (
            <div key={reminder.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{reminder.topic}</p>
                  <p className="text-xs text-gray-500">{reminder.course}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    reminder.daysLeft <= 3 ? 'bg-red-100 text-red-800' :
                    reminder.daysLeft <= 7 ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {reminder.daysLeft} days left
                  </span>
                  <button 
                    onClick={() => handleReviseTopic(reminder.topic, reminder.course)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    Revise
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'progress':
        return <ProgressTracker />;
      case 'ai-tools':
        return <RevisionTool />;
      case 'materials':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Materials</h3>
            <p className="text-gray-600">Access all your course materials, videos, notes, and documentation.</p>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('overview')}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                View All Materials
              </button>
            </div>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">

      {/* Header */}
      <div className="bg-white shadow-sm border-b w-full">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center py-6">
                         <div>
               <h1 className="text-2xl font-bold text-gray-900">{userName}'s Dashboard</h1>
               <p className="text-sm text-gray-600">Track your progress and access learning materials</p>
             </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleStartLearning}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Start Learning
              </button>
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-medium">S</span>
                  </div>
                  <span className="hidden md:block">Student</span>
                </button>
              </div>
              <button 
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b w-full">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
              { id: 'materials', label: 'Materials', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { id: 'progress', label: 'Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'ai-tools', label: 'AI Tools', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
