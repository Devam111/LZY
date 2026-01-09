import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/SimpleAuthContext';
import CourseManager from './CourseManager';
import ResourceUploader from './ResourceUploader';
import { coursesAPI } from '../../api/courses.js';
import { materialsAPI } from '../../api/materials.js';
import { enrollmentsAPI } from '../../api/enrollments.js';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseMaterials, setSelectedCourseMaterials] = useState([]);
  const [selectedCourseEnrollments, setSelectedCourseEnrollments] = useState([]);
  const [showCourseOverview, setShowCourseOverview] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalContent: 0,
    avgProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [openEditMenuCourseId, setOpenEditMenuCourseId] = useState(null);
  const editMenuRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  
  const userName = (user?.name) || localStorage.getItem('userName') || 'Faculty';

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    // React to URL hash for deep-linking to upload
    const applyHash = () => {
      if (window.location.hash === '#upload') {
        setActiveTab('upload');
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    const handleClickOutside = (event) => {
      if (editMenuRef.current && !editMenuRef.current.contains(event.target)) {
        setOpenEditMenuCourseId(null);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    const openUploadHandler = () => setActiveTab('upload');
    window.addEventListener('open-upload', openUploadHandler);
    // Live refresh on focus and periodically
    const handleFocus = () => loadDashboardData();
    window.addEventListener('focus', handleFocus);
    const intervalId = setInterval(() => loadDashboardData(), 15000);
    const coursesChanged = () => loadDashboardData();
    const materialsChanged = () => {
      loadDashboardData();
      // If course details modal is open, refresh materials
      if (isDetailsOpen && selectedCourse) {
        loadCourseDetails(selectedCourse);
      }
    };
    window.addEventListener('courses-changed', coursesChanged);
    window.addEventListener('materials-changed', materialsChanged);
    // expose imperative helper for same-page children
    window.__openUpload = () => setActiveTab('upload');
    return () => {
      window.removeEventListener('hashchange', applyHash);
      window.removeEventListener('open-upload', openUploadHandler);
      document.removeEventListener('mousedown', handleClickOutside);
      delete window.__openUpload;
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      window.removeEventListener('courses-changed', coursesChanged);
      window.removeEventListener('materials-changed', materialsChanged);
    };
  }, []);

  // Redirect to login after logout or when unauthenticated
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousedown', () => {});
    };
  }, []);

  const goToUpload = (course, type) => {
    try {
      const preset = { courseId: course._id || course.id, type };
      localStorage.setItem('uploadPreset', JSON.stringify(preset));
      window.location.hash = '#upload';
      window.dispatchEvent(new Event('open-upload'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Failed to set upload preset', e);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load instructor's courses using the same approach as CourseManager
      const coursesResponse = await coursesAPI.getMyCourses();
      if (coursesResponse && coursesResponse.success) {
        setCourses(coursesResponse.courses || []);
        
        // Calculate stats
        let totalStudents = 0;
        let totalContent = 0;
        let totalProgress = 0;
        
        for (const course of coursesResponse.courses || []) {
          // Get course enrollments (normalize response to array)
          const enrollmentsResp = await enrollmentsAPI.getCourseEnrollments(course._id);
          const enrollments = Array.isArray(enrollmentsResp)
            ? enrollmentsResp
            : (enrollmentsResp?.enrollments || []);
          totalStudents += enrollments.length;
          
          // Get course materials (normalize response to array)
          const materialsResp = await materialsAPI.getFacultyCourseMaterials(course._id);
          const materials = Array.isArray(materialsResp)
            ? materialsResp
            : (materialsResp?.materials || (materialsResp?.success ? materialsResp.materials : []));
          totalContent += materials.length;
          
          // Calculate average progress
          const courseProgress = enrollments.reduce((acc, enrollment) => acc + (enrollment.progress || 0), 0);
          totalProgress += courseProgress / Math.max(enrollments.length, 1);
        }
        
        setStats({
          totalStudents,
          totalCourses: coursesResponse.courses.length,
          totalContent,
          avgProgress: Math.round(totalProgress / Math.max(coursesResponse.courses.length, 1))
        });
        
        // Generate recent activities and collect all materials
        const activities = [];
        const allMaterials = [];
        for (const course of coursesResponse.courses || []) {
          const materialsResp = await materialsAPI.getFacultyCourseMaterials(course._id);
          const materials = Array.isArray(materialsResp)
            ? materialsResp
            : (materialsResp?.materials || (materialsResp?.success ? materialsResp.materials : []));
          const enrollmentsResp = await enrollmentsAPI.getCourseEnrollments(course._id);
          const enrollments = Array.isArray(enrollmentsResp)
            ? enrollmentsResp
            : (enrollmentsResp?.enrollments || []);
          
          // Add materials with course info
          materials.forEach(material => {
            allMaterials.push({
              ...material,
              courseTitle: course.title,
              courseId: course._id
            });
          });
          
          // Add material uploads (enriched)
          materials.slice(0, 2).forEach(material => {
            activities.push({
              id: material._id,
              type: 'upload',
              content: `Uploaded ${material.type}: ${material.title}`,
              time: new Date(material.createdAt).toLocaleDateString(),
              data: {
                materialTitle: material.title,
                materialType: material.type,
                fileUrl: material.fileUrl,
                createdAt: material.createdAt,
                courseTitle: course.title
              }
            });
          });
          
          // Add student enrollments/progress (enriched)
          enrollments.slice(0, 1).forEach(enrollment => {
            activities.push({
              id: enrollment._id,
              type: 'progress',
              content: `Student ${enrollment.student?.name || 'Unknown'} enrolled in ${course.title}`,
              time: new Date(enrollment.enrolledAt).toLocaleDateString(),
              data: {
                studentName: enrollment.student?.name || 'Unknown',
                enrolledAt: enrollment.enrolledAt,
                progress: enrollment.progress || 0,
                courseTitle: course.title
              }
            });
          });
        }
        
        setRecentActivities(activities.slice(0, 4));
        
        // Sort materials by creation date (newest first) and store recent ones
        const sortedMaterials = allMaterials.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setRecentMaterials(sortedMaterials.slice(0, 10)); // Store 10 most recent
      } else {
        setCourses([]);
        setStats({
          totalStudents: 0,
          totalCourses: 0,
          totalContent: 0,
          avgProgress: 0
        });
        setRecentActivities([]);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const openCourseDetails = async (course) => {
    try {
      setSelectedCourse(course);
      setIsDetailsOpen(true);
      setShowCourseOverview(false);
      await loadCourseDetails(course);
    } catch (e) {
      console.error('Failed to load course details', e);
      setSelectedCourseMaterials([]);
      setSelectedCourseEnrollments([]);
    }
  };

  const loadCourseDetails = async (course) => {
    try {
      // Load details data
      const [materialsResp, enrollmentsResp] = await Promise.all([
        materialsAPI.getFacultyCourseMaterials(course._id || course.id), // Use faculty endpoint to get all materials
        enrollmentsAPI.getCourseEnrollments(course._id || course.id)
      ]);
      // Handle materials response - faculty endpoint returns { success, materials }
      const materials = Array.isArray(materialsResp) 
        ? materialsResp 
        : (materialsResp?.materials || (materialsResp?.success ? materialsResp.materials : []));
      const enrollments = Array.isArray(enrollmentsResp) ? enrollmentsResp : (enrollmentsResp?.enrollments || []);
      setSelectedCourseMaterials(materials);
      setSelectedCourseEnrollments(enrollments);
    } catch (e) {
      console.error('Failed to load course details', e);
      setSelectedCourseMaterials([]);
      setSelectedCourseEnrollments([]);
    }
  };

  const closeCourseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedCourse(null);
    setSelectedCourseMaterials([]);
    setSelectedCourseEnrollments([]);
    setShowCourseOverview(false);
  };

  const handleOpenMaterial = (material) => {
    if (material?.fileUrl) {
      window.open(material.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCreateCourse = () => {
    // Switch to the courses tab where CourseManager component handles course creation
    setActiveTab('courses');
  };

  const handleTogglePublish = async (course) => {
    try {
      const response = await coursesAPI.togglePublish(course._id || course.id);
      if (response && response.success) {
        // Reload courses to reflect the change
        loadDashboardData();
        // Show success message
        alert(`Course ${response.course.isPublished ? 'published' : 'unpublished'} successfully!`);
      } else {
        alert('Failed to update course status');
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Error updating course status');
    }
  };

  const handleUploadContent = () => {
    setActiveTab('upload');
  };

  const handleViewActivity = (activityId) => {
    const act = recentActivities.find(a => a.id === activityId);
    setSelectedActivity(act || null);
    setIsActivityOpen(!!act);
  };

  // const handleRefreshData = () => {
  //   loadDashboardData();
  // };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{Math.min(stats.avgProgress || 0, 100)}%</p>
            </div>
          </div>
        </div>
      </div>

      
      {/* Course Management Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Course Management</h3>
            </div>
            {courses.length > 0 && (
              <button
                onClick={handleCreateCourse}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Create New Course
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">Loading courses...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-8">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={loadDashboardData}
                  className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
                <button
                  onClick={handleCreateCourse}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              courses.map((course) => (
                <div key={course._id || course.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          course.status === 'active' ? 'bg-green-100 text-green-800' :
                          course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status || 'Draft'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-900 text-sm mb-4">{course.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Students</p>
                        <p className="text-sm font-medium text-gray-900">{course.students || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Progress</p>
                        <p className="text-sm font-medium text-gray-900">{Math.min(course.progress || 0, 100)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Modules</p>
                        <p className="text-sm font-medium text-gray-900">{course.modules?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-medium text-gray-900">{course.duration || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Updated: {new Date(course.updatedAt || course.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2 relative">
                        <button 
                          onClick={() => handleTogglePublish(course)} 
                          className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                            course.isPublished 
                              ? 'bg-orange-600 text-white hover:bg-orange-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {course.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenEditMenuCourseId(openEditMenuCourseId === (course._id || course.id) ? null : (course._id || course.id))}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        {openEditMenuCourseId === (course._id || course.id) && (
                          <div ref={editMenuRef} className="absolute right-0 top-full mt-2 bg-white border rounded-md shadow-lg z-50 w-44">
                            <button type="button" onClick={() => { setOpenEditMenuCourseId(null); goToUpload(course, 'video'); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Upload Video</button>
                            <button type="button" onClick={() => { setOpenEditMenuCourseId(null); goToUpload(course, 'documentation'); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Upload Document</button>
                          </div>
                        )}
                        <button 
                          onClick={() => openCourseDetails(course)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recently Uploaded Materials */}
      {recentMaterials.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recently Uploaded Materials</h3>
              <button
                onClick={loadDashboardData}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                title="Refresh"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentMaterials.slice(0, 5).map((material) => {
              const fileUrl = material.fileUrl || material.url || 
                (material.filePath ? `/uploads/materials/${material.filePath.split('/').pop()}` : null);
              
              return (
                <div key={material._id || material.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        material.type === 'video' ? 'bg-red-100' :
                        material.type === 'pdf' || material.type === 'notes' ? 'bg-purple-100' :
                        material.type === 'roadmap' ? 'bg-emerald-100' :
                        'bg-indigo-100'
                      }`}>
                        {material.type === 'video' ? (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{material.title || 'Untitled Material'}</p>
                        <p className="text-xs text-gray-500">{material.courseTitle || 'Unknown Course'} • {material.type || 'document'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(material.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {fileUrl && (
                        <a
                          href={fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => {
                          const course = courses.find(c => c._id === material.courseId || c.id === material.courseId);
                          if (course) openCourseDetails(course);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Course
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {recentMaterials.length > 5 && (
            <div className="px-6 py-3 border-t text-center">
              <button
                onClick={() => setActiveTab('courses')}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                View All Materials ({recentMaterials.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'upload' ? 'bg-emerald-100' :
                    activity.type === 'quiz' ? 'bg-purple-100' :
                    'bg-amber-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      activity.type === 'upload' ? 'text-emerald-600' :
                      activity.type === 'quiz' ? 'text-purple-600' :
                      'text-amber-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {activity.type === 'upload' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      )}
                      {activity.type === 'quiz' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                      {activity.type === 'progress' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      )}
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.content}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewActivity(activity.id)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Activity Details Modal */}
      {isActivityOpen && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl mt-16">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Activity Details</h3>
              <button onClick={() => { setIsActivityOpen(false); setSelectedActivity(null); }} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="text-sm text-gray-600">{selectedActivity.content}</div>
              {selectedActivity.type === 'upload' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-md p-3 border">
                      <p className="text-xs text-gray-500">Course</p>
                      <p className="text-sm font-medium text-gray-900">{selectedActivity.data?.courseTitle}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 border">
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedActivity.data?.materialType || 'document'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 border rounded-md px-3 py-2">
                    <span className="text-sm">{selectedActivity.data?.materialTitle}</span>
                    {selectedActivity.data?.fileUrl && (
                      <button onClick={() => window.open(selectedActivity.data.fileUrl, '_blank', 'noopener,noreferrer')} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Open</button>
                    )}
                  </div>
                </div>
              )}
              {selectedActivity.type === 'progress' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-md p-3 border">
                      <p className="text-xs text-gray-500">Student</p>
                      <p className="text-sm font-medium text-gray-900">{selectedActivity.data?.studentName}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 border">
                      <p className="text-xs text-gray-500">Course</p>
                      <p className="text-sm font-medium text-gray-900">{selectedActivity.data?.courseTitle}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 border">
                      <p className="text-xs text-gray-500">Enrolled</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(selectedActivity.data?.enrolledAt).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 border">
                      <p className="text-xs text-gray-500">Progress</p>
                      <p className="text-sm font-medium text-gray-900">{Math.min(selectedActivity.data?.progress || 0, 100)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button onClick={() => { setIsActivityOpen(false); setSelectedActivity(null); }} className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'courses':
        return <CourseManager />;
      case 'upload':
        return <ResourceUploader />;
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
               <p className="text-sm text-gray-600">Manage your courses and content</p>
             </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium">F</span>
                  </div>
                  <span className="hidden md:block">Faculty</span>
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
                        <span className="col-span-2 text-gray-900">{userName}</span>
                        <span className="col-span-1 text-gray-500">Role</span>
                        <span className="col-span-2 text-gray-900 capitalize">{user?.role || localStorage.getItem('userType') || 'faculty'}</span>
                        <span className="col-span-1 text-gray-500">Institution</span>
                        <span className="col-span-2 text-gray-900">{user?.institution || localStorage.getItem('institution') || 'N/A'}</span>
                        {user?.department || localStorage.getItem('department') ? (
                          <>
                            <span className="col-span-1 text-gray-500">Department</span>
                            <span className="col-span-2 text-gray-900">{user?.department || localStorage.getItem('department')}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="border-t">
                      <button
                        onClick={() => { setIsProfileOpen(false); logout(); navigate('/login'); }}
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
              { id: 'courses', label: 'Courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { id: 'upload', label: 'Upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' }
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
        {renderContent()}
      </div>

      {/* Details Modal */}
      {isDetailsOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mt-16">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedCourse.title}</h3>
                <p className="text-sm text-gray-900">{selectedCourse.description}</p>
              </div>
              <button onClick={closeCourseDetails} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-md p-4 border">
                  <p className="text-xs text-gray-500">Students</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCourseEnrollments.length}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4 border">
                  <p className="text-xs text-gray-500">Modules</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCourse.modules?.length || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4 border">
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-lg font-semibold text-gray-900">{Math.min(selectedCourse.progress || 0, 100)}%</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4 border">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCourse.duration || 'N/A'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Updated: {new Date(selectedCourse.updatedAt || selectedCourse.createdAt).toLocaleDateString()}</p>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Recent Enrollments</h4>
                {selectedCourseEnrollments.length > 0 ? (
                  <ul className="space-y-2 max-h-40 overflow-auto">
                    {selectedCourseEnrollments.slice(0,5).map(e => (
                      <li key={e._id || e.id} className="flex items-center justify-between text-sm bg-gray-50 border rounded-md px-3 py-2">
                        <span className="text-gray-900">{e.student?.name || 'Student'} </span>
                        <span className="text-gray-500">{new Date(e.enrolledAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No enrollments yet.</p>
                )}
              </div>

              {/* Course Materials */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-medium text-gray-900">Course Materials ({selectedCourseMaterials.length})</h4>
                  <button
                    onClick={() => loadCourseDetails(selectedCourse)}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    title="Refresh materials"
                  >
                    Refresh
                  </button>
                </div>
                {selectedCourseMaterials.length > 0 ? (
                  <ul className="space-y-2 max-h-60 overflow-auto">
                    {selectedCourseMaterials.map((material) => {
                      const fileUrl = material.fileUrl || material.url || 
                        (material.filePath ? `/uploads/materials/${material.filePath.split('/').pop()}` : null);
                      
                      return (
                        <li key={material._id || material.id} className="flex items-center justify-between text-sm bg-gray-50 border rounded-md px-3 py-2">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`p-1.5 rounded ${
                              material.type === 'video' ? 'bg-red-100' :
                              material.type === 'pdf' || material.type === 'notes' ? 'bg-purple-100' :
                              material.type === 'roadmap' ? 'bg-emerald-100' :
                              'bg-indigo-100'
                            }`}>
                              {material.type === 'video' ? (
                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{material.title || 'Untitled Material'}</p>
                              <p className="text-xs text-gray-500 capitalize">{material.type || 'document'}</p>
                            </div>
                          </div>
                          {fileUrl && (
                            <a
                              href={fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 text-xs font-medium ml-2"
                            >
                              View
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No materials uploaded yet. Use the Upload tab to add materials.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end">
              <button onClick={() => setShowCourseOverview(!showCourseOverview)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">{showCourseOverview ? 'Hide Overview' : 'View Overview'}</button>
            </div>

            {showCourseOverview && (
              <div className="px-6 pb-6 space-y-6">
                <div className="bg-white">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-md p-4 border">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{selectedCourse.status || (selectedCourse.isPublished ? 'published' : 'draft')}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-4 border">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedCourse.duration || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-4 border">
                      <p className="text-xs text-gray-500">Progress</p>
                      <p className="text-lg font-semibold text-gray-900">{Math.min(selectedCourse.progress || 0, 100)}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-4 border">
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-lg font-semibold text-gray-900">{new Date(selectedCourse.updatedAt || selectedCourse.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Course Summary</h4>
                  <p className="text-sm text-gray-600 leading-6">
                    {selectedCourse.description || 'This course provides a comprehensive, hands-on introduction with practical examples and guided exercises. You will build confidence step-by-step and develop an intuition for key concepts used in real projects.'}
                  </p>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Modules</h4>
                  {selectedCourse.modules?.length ? (
                    <ul className="space-y-2 max-h-56 overflow-auto">
                      {selectedCourse.modules.map((m, idx) => (
                        <li key={m._id || m.id || idx} className="bg-gray-50 border rounded-md px-3 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{m.title || `Module ${idx+1}`}</p>
                              {m.description && (<p className="text-xs text-gray-500">{m.description}</p>)}
                            </div>
                            {m.duration && (<span className="text-xs text-gray-500">{m.duration}</span>)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No modules defined yet.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Learning Outcomes</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    <li>Understand core concepts and best practices</li>
                    <li>Apply knowledge to small, practical tasks</li>
                    <li>Structure projects with clear, maintainable modules</li>
                    <li>Read and reason about existing code effectively</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
