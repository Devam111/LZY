import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/SimpleAuthContext';
import { coursesAPI } from '../api/courses.js';
import { materialsAPI } from '../api/materials.js';
import { enrollmentsAPI } from '../api/enrollments.js';

const CourseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const authLoading = auth?.isLoading || false;
  const isAuthenticated = auth?.isAuthenticated || !!localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState('materials'); // Default to materials tab
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedMaterials, setCompletedMaterials] = useState(new Set());
  const [courseProgress, setCourseProgress] = useState({ completed: 0, total: 0, percentage: 0 });

  // Check authentication on component mount
  useEffect(() => {
    // Check if user has token - don't wait for auth context
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login...');
      navigate('/login');
      return;
    }
    
    console.log('Loading course data for course ID:', id);
    // Load course data immediately - don't wait for auth context
    loadCourseData();
    
    // Set active tab based on URL hash or default to materials for students
    const userType = localStorage.getItem('userType');
    const hash = window.location.hash;
    
    if (userType === 'student') {
      // For students, always default to materials tab, but respect hash if present
      if (hash === '#materials' || hash === '') {
        setActiveTab('materials');
      } else if (hash === '#overview') {
        setActiveTab('overview');
      } else {
        setActiveTab('materials'); // Default to materials for students
      }
    } else if (hash === '#materials') {
      setActiveTab('materials');
    } else if (hash === '#overview') {
      setActiveTab('overview');
    }

    // Listen for hash changes to switch tabs
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      if (currentHash === '#materials') {
        setActiveTab('materials');
      } else if (currentHash === '#overview') {
        setActiveTab('overview');
      } else if (userType === 'student' && currentHash === '') {
        setActiveTab('materials'); // Default to materials for students
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Listen for materials changes to auto-refresh
    const handleMaterialsChanged = () => {
      console.log('Materials changed event detected, refreshing course data...');
      loadCourseData();
    };

    window.addEventListener('materials-changed', handleMaterialsChanged);
    window.addEventListener('courses-changed', handleMaterialsChanged);
    window.addEventListener('progress-updated', handleMaterialsChanged);

    // Refresh periodically to catch new uploads
    const refreshInterval = setInterval(() => {
      if (isAuthenticated && !isLoading) {
        loadCourseData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('materials-changed', handleMaterialsChanged);
      window.removeEventListener('courses-changed', handleMaterialsChanged);
      window.removeEventListener('progress-updated', handleMaterialsChanged);
      clearInterval(refreshInterval);
    };
  }, [id, isAuthenticated, authLoading, navigate]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load course details (normalize response)
      let courseData = null;
      try {
        const courseResponse = await coursesAPI.getById(id);
        courseData = courseResponse?.course || courseResponse;
        if (!courseData || !courseData._id) {
          throw new Error('Course not found');
        }
        setCourse(courseData);
      } catch (courseError) {
        console.error('Error loading course:', courseError);
        setError(courseError.response?.data?.message || courseError.message || 'Failed to load course');
        setIsLoading(false);
        return;
      }
      
      // Load course materials (normalize response)
      let materialsData = [];
      try {
        const materialsResponse = await materialsAPI.getCourseMaterials(id);
        console.log('Materials response:', materialsResponse);
        
        // Handle different response formats
        if (materialsResponse?.success === false) {
          console.warn('Materials API returned error:', materialsResponse.message);
          materialsData = [];
        } else if (Array.isArray(materialsResponse)) {
          materialsData = materialsResponse;
        } else if (materialsResponse?.materials) {
          materialsData = materialsResponse.materials;
        } else if (materialsResponse?.data?.materials) {
          materialsData = materialsResponse.data.materials;
        } else {
          materialsData = [];
        }
        
        console.log('Parsed materials:', materialsData);
      } catch (materialError) {
        console.warn('Error loading materials:', materialError);
        // Don't fail the whole page if materials fail to load
        materialsData = [];
        // Only set error if it's a critical error (not enrollment check)
        if (materialError.response?.status !== 403 && materialError.response?.status !== 404) {
          console.error('Material loading error:', materialError);
        }
      }
      
      // Sort materials by order, then by creation date (newest first)
      materialsData = materialsData.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If no order, sort by creation date (newest first)
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setMaterials(materialsData);
      
      // Set modules from course data
      setModules(courseData?.modules || []);
      
      // Check if user is enrolled
      const userType = localStorage.getItem('userType');
      if (userType === 'student') {
        try {
          const enrollmentsResponse = await enrollmentsAPI.getMyEnrollments();
          const enrollments = Array.isArray(enrollmentsResponse) 
            ? enrollmentsResponse 
            : (enrollmentsResponse?.enrollments || (enrollmentsResponse?.success ? enrollmentsResponse.enrollments : []));
          const enrollment = enrollments.find(e => {
            const courseId = e.course?._id || e.course?.id || e.course;
            return courseId === id || courseId?.toString() === id;
          });
          setIsEnrolled(!!enrollment);
        
          // Load completed materials if enrolled
          if (enrollment) {
          try {
            const completedResponse = await materialsAPI.getCompletedMaterials(id);
            if (completedResponse?.success && completedResponse?.completedMaterials) {
              setCompletedMaterials(new Set(completedResponse.completedMaterials));
              
              // Calculate progress
              const completed = completedResponse.completedMaterials.length;
              const total = materialsData.length;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
              setCourseProgress({ completed, total, percentage });
            } else {
              // Fallback: check materials for isCompleted flag
              const completedSet = new Set();
              materialsData.forEach(material => {
                if (material.isCompleted) {
                  completedSet.add(material._id || material.id);
                }
              });
              setCompletedMaterials(completedSet);
              
              const completed = completedSet.size;
              const total = materialsData.length;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
              setCourseProgress({ completed, total, percentage });
            }
          } catch (err) {
            console.warn('Failed to load completed materials:', err);
            // Fallback: check materials for isCompleted flag
            const completedSet = new Set();
            materialsData.forEach(material => {
              if (material.isCompleted) {
                completedSet.add(material._id || material.id);
              }
            });
            setCompletedMaterials(completedSet);
          }
          }
        } catch (enrollmentErr) {
          console.warn('Failed to check enrollment:', enrollmentErr);
        }
      }
      
    } catch (error) {
      console.error('Error loading course data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load course data';
      setError(errorMessage);
      // Don't set course to null if it was already loaded
      if (!course) {
        setCourse(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      await enrollmentsAPI.enroll(id);
      setIsEnrolled(true);
      alert('Successfully enrolled in course!');
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll in course. Please try again.');
    }
  };

  const handleStartModule = (moduleId) => {
    // In a real app, this would start the module or navigate to the module content
    alert(`Starting module: ${moduleId}. This would open the module content in a real application.`);
  };

  // const handleBackToDashboard = () => {
  //   const userType = localStorage.getItem('userType');
  //   if (userType === 'student') {
  //     navigate('/student-dashboard');
  //   } else {
  //     navigate('/faculty-dashboard');
  //   }
  // };

  const handleViewMaterial = (material) => {
    // If material has a fileUrl, open it
    if (material.fileUrl || material.url) {
      const fileUrl = material.fileUrl || material.url;
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`;
      
      // For PDFs, open in new tab for viewing/downloading
      if (material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation') {
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      } else {
        // For other types, try to open
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      alert(`Material "${material.title}" is not available yet.`);
    }
  };

  const handleMaterialToggle = async (material) => {
    if (!isEnrolled) {
      alert('You must be enrolled in this course to mark materials as completed.');
      return;
    }

    const materialId = material._id || material.id;
    const isCompleted = completedMaterials.has(materialId);
    
    try {
      const response = await materialsAPI.markMaterialCompleted(materialId, !isCompleted);
      
      if (response?.success) {
        // Update local state
        const newCompleted = new Set(completedMaterials);
        if (!isCompleted) {
          newCompleted.add(materialId);
        } else {
          newCompleted.delete(materialId);
        }
        setCompletedMaterials(newCompleted);
        
        // Update progress
        if (response.progress) {
          setCourseProgress({
            completed: response.progress.completedMaterials,
            total: response.progress.totalMaterials,
            percentage: response.progress.percentage
          });
        } else {
          // Recalculate progress
          const completed = newCompleted.size;
          const total = materials.length;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          setCourseProgress({ completed, total, percentage });
        }
        
        // Trigger dashboard refresh to update progress in overview
        window.dispatchEvent(new Event('materials-changed'));
        window.dispatchEvent(new Event('progress-updated'));
        
        // Also refresh enrollment data to get updated progress
        try {
          const enrollmentsResponse = await enrollmentsAPI.getMyEnrollments();
          const enrollments = Array.isArray(enrollmentsResponse) 
            ? enrollmentsResponse 
            : (enrollmentsResponse?.enrollments || (enrollmentsResponse?.success ? enrollmentsResponse.enrollments : []));
          const enrollment = enrollments.find(e => {
            const courseId = e.course?._id || e.course?.id || e.course;
            return courseId === id || courseId?.toString() === id;
          });
          if (enrollment && enrollment.progress) {
            // Update local progress state if enrollment has updated progress
            const enrollmentProgress = enrollment.progress.percentage || 0;
            if (enrollmentProgress !== courseProgress.percentage) {
              setCourseProgress(prev => ({
                ...prev,
                percentage: enrollmentProgress
              }));
            }
          }
        } catch (err) {
          console.warn('Failed to refresh enrollment progress:', err);
        }
      }
    } catch (error) {
      console.error('Error toggling material completion:', error);
      alert('Failed to update material completion. Please try again.');
    }
  };

  const handleBackToDashboard = () => {
    const userType = localStorage.getItem('userType');
    if (userType === 'faculty') {
      navigate('/faculty-dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  const renderOverview = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-500">Loading course details...</p>
          </div>
        </div>
      );
    }

    if (error || !course) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-red-500">{error || 'Course not found'}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Instructor: {course.instructor?.name || 'Unknown'}</span>
                <span>Duration: {course.duration}</span>
                <span>{modules.length} modules</span>
                <span>{course.students || 0} students enrolled</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-bold text-amber-600">{course.rating || 4.5}</span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < Math.floor(course.rating || 4.5) ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {new Date(course.updatedAt || course.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

      {/* Course Modules */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Course Modules</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {modules.length > 0 ? (
            modules.map((module) => (
            <div key={module._id || module.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    module.completed ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      module.completed ? 'text-emerald-600' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {module.completed ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{module.title}</h4>
                    <p className="text-xs text-gray-500">{module.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-400">{module.duration || 'N/A'}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400 capitalize">{module.type || 'module'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleStartModule(module._id || module.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    module.completed
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {module.completed ? 'Completed' : 'Start'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No modules available yet.</p>
          </div>
        )}
        </div>
      </div>

      {/* Course Progress (for students) */}
      {isEnrolled && courseProgress.total > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Course Progress</h3>
            <span className="text-sm font-semibold text-purple-600">{courseProgress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${courseProgress.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {courseProgress.completed} of {courseProgress.total} materials completed
          </p>
        </div>
      )}

      {/* Course Materials */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Course Materials</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {materials.length > 0 ? (
            materials.map((material) => {
              const materialId = material._id || material.id;
              const isCompleted = completedMaterials.has(materialId);
              
              return (
                <div key={materialId} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Checkbox for students */}
                      {isEnrolled && (
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => handleMaterialToggle(material)}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                        />
                      )}
                      <div className={`p-2 rounded-lg ${
                        material.type === 'video' ? 'bg-red-100' :
                        material.type === 'notes' || material.type === 'pdf' ? 'bg-purple-100' :
                        material.type === 'roadmap' ? 'bg-emerald-100' :
                        'bg-indigo-100'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          material.type === 'video' ? 'text-red-600' :
                          material.type === 'notes' || material.type === 'pdf' ? 'text-purple-600' :
                          material.type === 'roadmap' ? 'text-emerald-600' :
                          'text-indigo-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {material.type === 'video' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          )}
                          {(material.type === 'notes' || material.type === 'pdf') && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          )}
                          {material.type === 'roadmap' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                          )}
                          {material.type === 'documentation' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                          )}
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {material.title}
                          </h4>
                          {isCompleted && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 capitalize">{material.type}</p>
                        {material.duration && (
                          <p className="text-xs text-gray-400">Duration: {material.duration}</p>
                        )}
                        {material.pages && (
                          <p className="text-xs text-gray-400">Pages: {material.pages}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewMaterial(material)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        {material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation' ? 'View/Download' : 'View'}
                      </button>
                      {(material.fileUrl || material.url) && (material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation') && (
                        <a
                          href={material.fileUrl?.startsWith('http') ? material.fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${material.fileUrl || material.url}`}
                          download
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No materials available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  }

  const renderMaterials = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-500">Loading materials...</p>
          </div>
        </div>
      );
    }

    if (error || !course) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-red-500">{error || 'Course not found'}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Course Progress (for students) */}
        {isEnrolled && courseProgress.total > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">Course Progress</h3>
              <span className="text-sm font-semibold text-purple-600">{courseProgress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${courseProgress.percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {courseProgress.completed} of {courseProgress.total} materials completed
            </p>
          </div>
        )}

        {/* Course Materials */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Course Materials</h3>
              <p className="text-sm text-gray-500 mt-1">Check off materials as you complete them</p>
            </div>
            <button
              onClick={() => loadCourseData()}
              className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors flex items-center space-x-2"
              title="Refresh materials"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {materials.length > 0 ? (
              materials.map((material) => {
                const materialId = material._id || material.id;
                const isCompleted = completedMaterials.has(materialId);
                
                return (
                  <div key={materialId} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Checkbox for students */}
                        {isEnrolled && (
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => handleMaterialToggle(material)}
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                        )}
                        <div className={`p-2 rounded-lg ${
                          material.type === 'video' ? 'bg-red-100' :
                          material.type === 'notes' || material.type === 'pdf' ? 'bg-purple-100' :
                          material.type === 'roadmap' ? 'bg-emerald-100' :
                          'bg-indigo-100'
                        }`}>
                          <svg className={`w-5 h-5 ${
                            material.type === 'video' ? 'text-red-600' :
                            material.type === 'notes' || material.type === 'pdf' ? 'text-purple-600' :
                            material.type === 'roadmap' ? 'text-emerald-600' :
                            'text-indigo-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {material.type === 'video' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            )}
                            {(material.type === 'notes' || material.type === 'pdf') && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            )}
                            {material.type === 'roadmap' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                            )}
                            {material.type === 'documentation' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                            )}
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {material.title}
                            </h4>
                            {isCompleted && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 capitalize">{material.type}</p>
                          {material.duration && (
                            <p className="text-xs text-gray-400">Duration: {material.duration}</p>
                          )}
                          {material.pages && (
                            <p className="text-xs text-gray-400">Pages: {material.pages}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewMaterial(material)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          {material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation' ? 'View/Download' : 'View'}
                        </button>
                        {(material.fileUrl || material.url) && (material.type === 'pdf' || material.type === 'notes' || material.type === 'documentation') && (
                          <a
                            href={material.fileUrl?.startsWith('http') ? material.fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${material.fileUrl || material.url}`}
                            download
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">No materials available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'modules':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">All Modules</h3>
            <p className="text-gray-600">Detailed view of all course modules and their content.</p>
          </div>
        );
      case 'materials':
        return renderMaterials();
      case 'progress':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Tracking</h3>
            <p className="text-gray-600">Track your progress through the course modules and assessments.</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  // Check authentication - use token from localStorage directly
  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show error state if course failed to load
  if (error && !course && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Course</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  loadCourseData();
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToDashboard}
                className="ml-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if course is still loading
  if (isLoading && !course && !error) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading course...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Always render something - even if course is null, show the page structure
  if (!course && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Course Not Found</h3>
              <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or you don't have access to it.</p>
              <button
                onClick={handleBackToDashboard}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course?.title || 'Course'}</h1>
                <p className="text-sm text-gray-600">Course Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {localStorage.getItem('userType') === 'student' && !isEnrolled && (
                <button 
                  onClick={handleEnroll}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Enroll Now
                </button>
              )}
              {localStorage.getItem('userType') === 'student' && isEnrolled && (
                <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-md text-sm font-medium">
                  Enrolled
                </span>
              )}
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
              { id: 'modules', label: 'Modules', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { id: 'materials', label: 'Materials', icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2' },
              { id: 'progress', label: 'Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
    </div>
  );
};

export default CourseDetailsPage;
