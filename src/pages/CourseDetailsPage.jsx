import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI, materialsAPI, enrollmentsAPI } from '../api/index.js';

const CourseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Load course data on component mount
  useEffect(() => {
    loadCourseData();
  }, [id]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      
      // Load course details
      const courseResponse = await coursesAPI.getById(id);
      setCourse(courseResponse);
      
      // Load course materials
      const materialsResponse = await materialsAPI.getCourseMaterials(id);
      setMaterials(materialsResponse || []);
      
      // Set modules from course data
      setModules(courseResponse?.modules || []);
      
      // Check if user is enrolled
      const userType = localStorage.getItem('userType');
      if (userType === 'student') {
        const enrollments = await enrollmentsAPI.getMyEnrollments();
        const enrollment = enrollments.find(e => e.course._id === id || e.course === id);
        setIsEnrolled(!!enrollment);
      }
      
    } catch (error) {
      console.error('Error loading course data:', error);
      setError('Failed to load course data');
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

  const handleViewMaterial = (materialId) => {
    // In a real app, this would open the material viewer
    alert(`Opening material: ${materialId}. This would open the material viewer in a real application.`);
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

      {/* Course Materials */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Course Materials</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {materials.length > 0 ? (
            materials.map((material) => (
            <div key={material._id || material.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    material.type === 'video' ? 'bg-red-100' :
                    material.type === 'notes' ? 'bg-purple-100' :
                    material.type === 'roadmap' ? 'bg-emerald-100' :
                    'bg-indigo-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      material.type === 'video' ? 'text-red-600' :
                      material.type === 'notes' ? 'text-purple-600' :
                      material.type === 'roadmap' ? 'text-emerald-600' :
                      'text-indigo-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {material.type === 'video' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                      {material.type === 'notes' && (
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
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{material.title}</h4>
                    <p className="text-xs text-gray-500 capitalize">{material.type}</p>
                    {material.duration && (
                      <p className="text-xs text-gray-400">Duration: {material.duration}</p>
                    )}
                    {material.pages && (
                      <p className="text-xs text-gray-400">Pages: {material.pages}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleViewMaterial(material._id || material.id)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View
                </button>
              </div>
            </div>
          ))
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
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">All Materials</h3>
            <p className="text-gray-600">Access all course materials, videos, notes, and documentation.</p>
          </div>
        );
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
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
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
