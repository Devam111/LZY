import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/SimpleAuthContext';
import ProgressTracker from './ProgressTracker';
import RevisionTool from './RevisionTool';
import StudyTimer from '../common/StudyTimer';
import LiveStats from '../common/LiveStats';
import AITools from './AITools';
import { coursesAPI } from '../../api/courses.js';
import { enrollmentsAPI } from '../../api/enrollments.js';
import { materialsAPI } from '../../api/materials.js';
import { progressAPI } from '../../api/progress.js';
import { studySessionAPI } from '../../api/studySession.js';
import { formatTimeFromAPI } from '../../utils/timeFormatter.js';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [revisionReminders, setRevisionReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [stats, setStats] = useState({ 
    enrolledCourses: 0, 
    avgProgress: 0, 
    studyTimeMinutes: 0, 
    studyTimeHours: 0,
    studyTimeFormatted: '0.0h',
    avgStudyTimePerDay: 0,
    completedMaterials: 0 
  });
  const [currentSession, setCurrentSession] = useState(null);
  const profileMenuRef = useRef(null);
  
  const userName = (user && typeof user === 'object' && user.name) ? user.name : 'Student';

  // Set active tab based on route
  useEffect(() => {
    if (location.pathname === '/courses') {
      setActiveTab('courses');
    }
  }, [location.pathname]);

  // Define loadDashboardData first
  const loadDashboardData = useCallback(async () => {
    console.log('loadDashboardData called');
    try {
      setIsLoading(true);
      setError(null);
      
      // Load available courses (only published courses for students)
      const coursesResponse = await coursesAPI.getAll({ isPublished: true });
      console.log('📚 Courses API Response:', coursesResponse);
      if (coursesResponse && coursesResponse.success) {
        console.log('📚 Available courses:', coursesResponse.courses);
        setAvailableCourses(coursesResponse.courses || []);
      } else {
        console.log('❌ Failed to load courses:', coursesResponse);
        setAvailableCourses([]);
      }
      
      // Load enrolled courses with progress
      const enrollmentsResponse = await enrollmentsAPI.getMyEnrollments();
      if (enrollmentsResponse && enrollmentsResponse.success) {
        setEnrolledCourses(enrollmentsResponse.enrollments || []);
      } else {
        setEnrolledCourses([]);
      }
      
      // Load live dashboard stats
      try {
        const dashboardResponse = await progressAPI.getStudentOverview();
        if (dashboardResponse && dashboardResponse.success) {
          const timeData = formatTimeFromAPI(dashboardResponse);
          setStats({
            enrolledCourses: dashboardResponse.enrolledCourses || 0,
            avgProgress: dashboardResponse.avgProgress || 0,
            studyTimeMinutes: timeData.studyTimeMinutes,
            studyTimeHours: timeData.studyTimeHours,
            studyTimeFormatted: timeData.formatted,
            avgStudyTimePerDay: timeData.avgStudyTimePerDay,
            completedMaterials: dashboardResponse.completedMaterials || dashboardResponse.completedLessons || 0
          });
        }
      } catch (overviewErr) {
        console.warn('Failed to load dashboard stats:', overviewErr);
        // Fallback: compute from enrollments
        const enrolls = enrollmentsResponse?.enrollments || [];
        const avg = enrolls.length
          ? Math.round(enrolls.reduce((acc, e) => acc + (e.progress?.percentage || 0), 0) / enrolls.length)
          : 0;
        const completed = enrolls.reduce((sum, e) => sum + (e.progress?.lessonsCompleted || 0), 0);
        setStats({
          enrolledCourses: enrolls.length,
          avgProgress: avg,
          studyTimeMinutes: 0,
          studyTimeHours: 0,
          studyTimeFormatted: '0.0h',
          avgStudyTimePerDay: 0,
          completedMaterials: completed
        });
      }
      
      // Load all materials from enrolled courses
      const materials = [];
      if (enrollmentsResponse && enrollmentsResponse.success && enrollmentsResponse.enrollments) {
        for (const enrollment of enrollmentsResponse.enrollments) {
          try {
            const courseId = enrollment.course?._id || enrollment.course?.id || enrollment.course;
            if (!courseId) continue;
            
            const courseMaterials = await materialsAPI.getCourseMaterials(courseId);
            // Handle both response formats
            const materialsList = Array.isArray(courseMaterials)
              ? courseMaterials
              : (courseMaterials?.materials || (courseMaterials?.success ? courseMaterials.materials : []));
            
            if (materialsList && materialsList.length > 0) {
              // Add course information to each material and ensure fileUrl is set
              const materialsWithCourse = materialsList.map(material => {
                // Ensure fileUrl is properly set
                let fileUrl = material.fileUrl || material.url;
                if (!fileUrl && material.filePath) {
                  const fileName = material.filePath.split('/').pop();
                  fileUrl = `/uploads/materials/${fileName}`;
                }
                
                return {
                  ...material,
                  course: enrollment.course,
                  courseId: courseId,
                  fileUrl: fileUrl
                };
              });
              materials.push(...materialsWithCourse);
            }
          } catch (materialError) {
            console.warn('Failed to load materials for course:', enrollment.course?._id || enrollment.course?.id, materialError);
          }
        }
      }
      setRecentMaterials(materials); // Store all materials from all enrolled courses
      
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
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    console.log('StudentDashboard useEffect triggered:', { authLoading, isAuthenticated });
    if (authLoading) return; // Wait for auth to load
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    console.log('User authenticated, loading dashboard data');
    loadDashboardData();
    startStudySession();
  }, [isAuthenticated, authLoading, loadDashboardData]);

  // Start study session when component mounts
  const startStudySession = async () => {
    try {
      await studySessionAPI.startSession(null, 'browsing');
      setCurrentSession({ startTime: new Date() });
    } catch (error) {
      console.warn('Failed to start study session:', error);
    }
  };


  // End study session when component unmounts
  useEffect(() => {
    return () => {
      if (currentSession) {
        studySessionAPI.endSession().catch(console.warn);
      }
    };
  }, [currentSession]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Refresh dashboard data periodically for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !isLoading) {
        loadDashboardData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading]);

  // Listen for material completion and progress update events to refresh
  useEffect(() => {
    const handleMaterialsChanged = () => {
      loadDashboardData();
    };
    const handleProgressUpdated = () => {
      loadDashboardData();
    };
    window.addEventListener('materials-changed', handleMaterialsChanged);
    window.addEventListener('progress-updated', handleProgressUpdated);
    return () => {
      window.removeEventListener('materials-changed', handleMaterialsChanged);
      window.removeEventListener('progress-updated', handleProgressUpdated);
    };
  }, [loadDashboardData]);

  const handleStartLearning = () => {
    // Navigate to the first course or show course selection
    if (enrolledCourses.length > 0) {
      const firstCourse = enrolledCourses[0];
      navigate(`/course/${firstCourse.course._id || firstCourse.course}`);
    } else {
      // If not enrolled in any courses, show available courses
      setActiveTab('courses');
    }
  };

  const handleViewCourse = (courseId) => {
    if (!courseId) {
      console.error('Course ID is missing');
      return;
    }
    // Route to the course details page which shows materials with checkboxes
    // Use hash to ensure materials tab is active
    console.log('Navigating to course:', courseId);
    navigate(`/course/${courseId}#materials`);
  };

  const handleViewMaterial = (material) => {
    // Construct file URL
    let fileUrl = material.fileUrl || material.url;
    if (!fileUrl && material.filePath) {
      const fileName = material.filePath.split('/').pop();
      fileUrl = `/uploads/materials/${fileName}`;
    }
    
    if (fileUrl) {
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`;
      
      // Open in new tab for viewing/downloading
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert(`Material "${material.title || material.name || 'Untitled'}" is not available yet.`);
    }
  };

  const handleReviseTopic = (topic, course) => {
    // In a real app, this would open the revision tool for the specific topic
    alert(`Starting revision for ${topic} in ${course}. This would open the revision tool in a real application.`);
  };

  const handleEnrollInCourse = async (courseId) => {
    try {
      // Show loading state
      const enrollButton = document.querySelector(`[data-course-id="${courseId}"]`);
      if (enrollButton) {
        enrollButton.disabled = true;
        enrollButton.textContent = 'Enrolling...';
      }

      const response = await enrollmentsAPI.enroll(courseId);
      if (response.success) {
        // Update the course in available courses to show enrolled status
        setAvailableCourses(prev => 
          prev.map(course => 
            course._id === courseId || course.id === courseId
              ? { ...course, isEnrolled: true }
              : course
          )
        );
        
        // Reload dashboard data to get updated stats
        await loadDashboardData();
        
        // Show success message
        alert('Successfully enrolled in course! You can now start learning.');
      } else {
        alert(response.message || 'Failed to enroll in course. Please try again.');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to enroll in course. Please try again.';
      alert(errorMessage);
    } finally {
      // Reset button state
      const enrollButton = document.querySelector(`[data-course-id="${courseId}"]`);
      if (enrollButton) {
        enrollButton.disabled = false;
        enrollButton.textContent = 'Enroll Now';
      }
    }
  };


  const renderMaterials = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Materials</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (enrolledCourses.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrolled Courses</h3>
            <p className="text-gray-600 mb-4">You need to enroll in courses to access learning materials.</p>
            <button
              onClick={() => setActiveTab('courses')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Browse Courses
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Materials</h2>
          <p className="text-gray-600">Access all your course materials, videos, notes, and documentation from your enrolled courses.</p>
        </div>

        {/* Materials by Course */}
        {enrolledCourses.map((enrollment) => {
          const course = enrollment.course;
          const courseMaterials = recentMaterials.filter(material => 
            material.courseId === (course._id || course.id) || 
            material.course?._id === (course._id || course.id)
          );

          return (
            <div key={course._id || course.id} className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Materials</p>
                    <p className="text-lg font-semibold text-purple-600">{courseMaterials.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {courseMaterials.length > 0 ? (
                  courseMaterials.map((material, index) => (
                    <div key={material._id || material.id || index} className="px-6 py-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {material.type === 'video' ? (
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          ) : material.type === 'pdf' ? (
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">{material.title || material.name || 'Untitled Material'}</h4>
                          <p className="text-xs text-gray-500 mt-1">{material.description || `Uploaded ${material.type || 'material'}`}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {material.type}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {material.duration || 0} min
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center space-x-2">
                          <button
                            onClick={() => handleViewMaterial(material)}
                            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                          >
                            {material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation' ? 'View/Download' : 'View'}
                          </button>
                          {(() => {
                            const fileUrl = material.fileUrl || material.url || 
                              (material.filePath ? `/uploads/materials/${material.filePath.split('/').pop()}` : null);
                            const isDownloadable = material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation' || material.type === 'text';
                            
                            return fileUrl && isDownloadable ? (
                              <a
                                href={fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`}
                                download
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                              >
                                Download
                              </a>
                            ) : null;
                          })()}
                          <button
                            onClick={() => handleViewCourse(course._id || course.id)}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Course
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No Materials Available</h4>
                    <p className="text-xs text-gray-500">This course doesn't have any materials yet.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('courses')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Browse More Courses</h4>
                  <p className="text-sm text-gray-500">Discover new courses to enroll in</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('progress')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">View Progress</h4>
                  <p className="text-sm text-gray-500">Track your learning progress</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCourses = () => (
    <div className="space-y-6">
      {/* Available Courses Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Courses</h2>
        <p className="text-gray-600">Discover and enroll in new courses to expand your knowledge</p>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {console.log('🎯 Rendering courses:', availableCourses.length, availableCourses)}
        {availableCourses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
              <p className="text-gray-500">No published courses are currently available for enrollment.</p>
            </div>
          </div>
        ) : availableCourses.map((course) => {
          // Use the isEnrolled flag from backend if available, otherwise check locally
          const isEnrolled = course.isEnrolled !== undefined 
            ? course.isEnrolled 
            : enrolledCourses.some(enrollment => 
                enrollment.course && (enrollment.course._id === course._id || enrollment.course.id === course.id)
              );
          
          return (
            <div key={course._id || course.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-500">{course.category || 'General'}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                
                {/* Faculty Information */}
                {course.facultyId && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Instructor:</span> {course.facultyId.name}
                    </p>
                    {course.facultyId.institution && (
                      <p className="text-xs text-gray-500">
                        {course.facultyId.institution}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {course.duration || 'Self-paced'}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {course.level || 'Beginner'}
                  </span>
                </div>
                
                {/* Course Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Modules: {course.modules?.length || 0}</span>
                  <span>Lessons: {course.totalLessons || 0}</span>
                  <span>Students: {course.enrollmentCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-purple-600">
                    {course.price ? `$${course.price}` : 'Free'}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isEnrolled ? (
                      <button
                        onClick={() => handleViewCourse(course._id || course.id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        data-course-id={course._id || course.id}
                        onClick={() => handleEnrollInCourse(course._id || course.id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {availableCourses.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
          <p className="text-gray-500">Check back later for new courses!</p>
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h2>
        <p className="text-purple-100">Continue your learning journey with personalized recommendations</p>
      </div>

      {/* Study Timer */}
      {enrolledCourses.length > 0 && (
        <StudyTimer 
          courseId={enrolledCourses[0].course._id || enrolledCourses[0].course.id}
          onSessionUpdate={(action, data) => {
            console.log('Study session update:', action, data);
            if (action === 'ended') {
              setTimeout(() => {
                loadDashboardData();
              }, 1000);
            }
          }}
        />
      )}

      {/* Live Stats */}
      <LiveStats />

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
              <p className="text-2xl font-bold text-gray-900">{typeof stats.enrolledCourses === 'number' ? stats.enrolledCourses : 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{Math.min(typeof stats.avgProgress === 'number' ? stats.avgProgress : 0, 100)}%</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.studyTimeFormatted || '0.0h'}</p>
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
              <p className="text-2xl font-bold text-gray-900">{typeof stats.completedMaterials === 'number' ? stats.completedMaterials : 0}</p>
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
               
               // Handle missing or malformed course data
               if (!course) {
                 return (
                   <div key={enrollment._id || enrollment.id} className="px-6 py-4">
                     <div className="flex items-center justify-between">
                       <div className="flex-1">
                         <h4 className="text-lg font-medium text-gray-900">Course Loading...</h4>
                         <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                           <span>Progress: {Math.min(typeof enrollment.progress === 'number' ? enrollment.progress : (enrollment.progress?.percentage || 0), 100)}%</span>
                           <span>Status: {enrollment.status || 'active'}</span>
                         </div>
                       </div>
                       <div className="ml-6">
                         <button
                           onClick={() => loadDashboardData()}
                           className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                         >
                           Refresh
                         </button>
                       </div>
                     </div>
                   </div>
                 );
               }
               
               return (
                 <div key={enrollment._id || enrollment.id} className="px-6 py-4">
                   <div className="flex items-center justify-between">
                     <div className="flex-1">
                       <h4 className="text-lg font-medium text-gray-900">{course.title || 'Untitled Course'}</h4>
                       <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                         <span>Progress: {Math.min(enrollment.progress?.percentage || 0, 100)}%</span>
                         <span>Enrolled: {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'Unknown'}</span>
                         <span>Status: {enrollment.status || 'active'}</span>
                       </div>
                       <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                         <div 
                           className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                           style={{ width: `${Math.min(enrollment.progress?.percentage || 0, 100)}%` }}
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
                 onClick={() => setActiveTab('courses')}
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
          {recentMaterials.length > 0 ? (
            recentMaterials.map((material, index) => (
              <div key={material.id || material._id || `material-${index}`} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{material.title}</h4>
                    <p className="text-xs text-gray-500">{material.course?.title || material.course || 'Unknown Course'}</p>
                    {material.duration && (
                      <p className="text-xs text-gray-400">Duration: {material.duration}</p>
                    )}
                    {material.pages && (
                      <p className="text-xs text-gray-400">Pages: {material.pages}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewMaterial(material)}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      {material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation' ? 'View/Download' : 'View'}
                    </button>
                    {(() => {
                      const fileUrl = material.fileUrl || material.url || 
                        (material.filePath ? `/uploads/materials/${material.filePath.split('/').pop()}` : null);
                      const isDownloadable = material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation' || material.type === 'text';
                      
                      return fileUrl && isDownloadable ? (
                        <a
                          href={fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`}
                          download
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Download
                        </a>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No recent materials available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Revision Reminders */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Revision Reminders</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {revisionReminders.length > 0 ? (
            revisionReminders.map((reminder, index) => (
              <div key={reminder.id || reminder._id || `reminder-${index}`} className="px-6 py-4">
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
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No revision reminders at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'courses':
        return renderCourses();
      case 'progress':
        return <ProgressTracker />;
      case 'ai-tools':
        return <AITools />;
      case 'materials':
        return renderMaterials();
      default:
        return renderOverview();
    }
  };

  // Debug logging
  console.log('StudentDashboard render:', { 
    authLoading, 
    isAuthenticated, 
    user, 
    isLoading, 
    error,
    activeTab 
  });

  // Force render something to test if component is working
  if (authLoading) {
    console.log('Auth is loading...');
  } else if (!isAuthenticated) {
    console.log('User not authenticated, should redirect to login');
  } else {
    console.log('User is authenticated, should show dashboard');
  }

  // Show loading state if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show login redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
                className="bg-purple-600 text-white h-8 px-3 rounded-md hover:bg-purple-700 transition-colors flex items-center text-sm"
              >
                Start Learning
              </button>
              <div className="relative" ref={profileMenuRef}>
                <button onClick={() => setIsProfileOpen((v) => !v)} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-medium">S</span>
                  </div>
                  <span className="hidden md:block">Student</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border rounded-md shadow-lg z-50">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.email || localStorage.getItem('userEmail') || 'unknown@example.com'}</p>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="col-span-1 text-gray-500">Name</span>
                        <span className="col-span-2 text-gray-900">{user?.name || localStorage.getItem('userName') || 'Student'}</span>
                        <span className="col-span-1 text-gray-500">Role</span>
                        <span className="col-span-2 text-gray-900 capitalize">{user?.role || localStorage.getItem('userType') || 'student'}</span>
                        <span className="col-span-1 text-gray-500">Institution</span>
                        <span className="col-span-2 text-gray-900">{user?.institution || localStorage.getItem('institution') || 'N/A'}</span>
                        {(user?.studentId || localStorage.getItem('studentId')) && (
                          <>
                            <span className="col-span-1 text-gray-500">Student ID</span>
                            <span className="col-span-2 text-gray-900">{user?.studentId || localStorage.getItem('studentId')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="border-t">
                      <button
                        onClick={() => { setIsProfileOpen(false); logout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
              { id: 'courses', label: 'Browse Courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { id: 'materials', label: 'Materials', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
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
