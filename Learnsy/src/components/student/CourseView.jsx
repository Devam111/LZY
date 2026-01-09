import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { materialsAPI } from '../../api/materials';
import { coursesAPI } from '../../api/courses';
import SubscriptionStatus from '../common/SubscriptionStatus';
import AccessRestriction from '../common/AccessRestriction';
import UpgradePopup from '../common/UpgradePopup';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAccessVideo, canAccessDocument, isFreeTrial } = useSubscription();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [studentProgress, setStudentProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [completedMaterials, setCompletedMaterials] = useState(new Set());
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load course materials
      const response = await materialsAPI.getCourseMaterials(courseId);
      
      if (response.success) {
        setCourse(response.course);
        setMaterials(response.materials || []);
        setQuizzes(response.quizzes || []);
        setStudentProgress(response.studentProgress);
        
        // Set first material as selected by default
        if (response.materials && response.materials.length > 0) {
          setSelectedMaterial(response.materials[0]);
        }
      } else {
        setError(response.message || 'Failed to load course data');
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      setError('Failed to load course data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaterialClick = async (material) => {
    // Check access based on material type and index
    const materialIndex = materials.findIndex(m => m._id === material._id);
    let hasAccess = true;

    if (material.type === 'video' && !canAccessVideo(materialIndex)) {
      hasAccess = false;
    } else if (material.type === 'pdf' && !canAccessDocument(materialIndex)) {
      hasAccess = false;
    }

    if (!hasAccess) {
      // Show upgrade popup for restricted content
      const message = material.type === 'video' 
        ? 'You can only access the first 3 videos per course with the free trial. Upgrade to premium for unlimited access.'
        : 'You can only access the first 2 documents per course with the free trial. Upgrade to premium for unlimited access.';
      setUpgradeMessage(message);
      setShowUpgradePopup(true);
      return;
    }

    setSelectedMaterial(material);
    
    // Mark as viewed (increment view count)
    try {
      await materialsAPI.getMaterialDetails(material._id);
    } catch (error) {
      console.warn('Failed to mark material as viewed:', error);
    }
  };

  const handleMarkCompleted = async (materialId) => {
    try {
      const response = await materialsAPI.markMaterialCompleted(materialId);
      if (response.success) {
        setCompletedMaterials(prev => new Set([...prev, materialId]));
        // Reload course data to update progress
        await loadCourseData();
      }
    } catch (error) {
      console.error('Error marking material as completed:', error);
      alert('Failed to mark material as completed');
    }
  };

  const renderMaterialContent = (material) => {
    if (!material) return null;

    switch (material.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: material.content.replace(/\n/g, '<br>') }} />
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              {material.url ? (
                <iframe
                  src={material.url}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={material.title}
                />
              ) : (
                <div className="text-white text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <p>Video content will be displayed here</p>
                  <p className="text-sm text-gray-400">Duration: {material.duration} minutes</p>
                </div>
              )}
            </div>
            {material.content && (
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: material.content.replace(/\n/g, '<br>') }} />
              </div>
            )}
          </div>
        );
      
      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Document</h3>
              <p className="text-gray-600 mb-4">{material.title}</p>
              {material.url && (
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Open PDF
                </a>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Content type not supported: {material.type}</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/student-dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-500">by {course.faculty?.name}</p>
              </div>
            </div>
            
            {studentProgress && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {Math.min(studentProgress.progressPercentage || 0, 100)}%
                  </p>
                </div>
                <div className="w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-purple-600"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${studentProgress.progressPercentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Status */}
        <SubscriptionStatus />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Materials List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
                <p className="text-sm text-gray-500">
                  {materials.length} materials • {quizzes.length} quizzes
                </p>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {materials.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No materials available for this course.</p>
                  </div>
                ) : materials.map((material, index) => {
                  const canAccess = material.type === 'video' 
                    ? canAccessVideo(index) 
                    : material.type === 'pdf' 
                    ? canAccessDocument(index) 
                    : true;
                  
                  return (
                    <div
                      key={material._id}
                      onClick={() => handleMaterialClick(material)}
                      className={`p-4 border-b transition-colors ${
                        canAccess 
                          ? `cursor-pointer ${
                              selectedMaterial?._id === material._id
                                ? 'bg-purple-50 border-purple-200'
                                : 'hover:bg-gray-50'
                            }`
                          : 'cursor-not-allowed opacity-60'
                      }`}
                    >
                    <div className="flex items-start space-x-3">
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
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {material.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {material.type} • {material.duration} min
                        </p>
                        {completedMaterials.has(material._id) && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Completed
                            </span>
                          </div>
                        )}
                        {!canAccess && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              Locked
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedMaterial ? (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {selectedMaterial.title}
                      </h1>
                      <p className="text-gray-600 mt-1">
                        {selectedMaterial.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {selectedMaterial.type}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                        {selectedMaterial.duration} min
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {(() => {
                    const materialIndex = materials.findIndex(m => m._id === selectedMaterial._id);
                    const canAccess = selectedMaterial.type === 'video' 
                      ? canAccessVideo(materialIndex) 
                      : selectedMaterial.type === 'pdf' 
                      ? canAccessDocument(materialIndex) 
                      : true;
                    
                    if (!canAccess) {
                      return (
                        <AccessRestriction 
                          feature={selectedMaterial.type === 'video' ? 'video' : 'document'}
                          message={selectedMaterial.type === 'video' 
                            ? 'You can only access the first 3 videos per course with the free trial.'
                            : 'You can only access the first 2 documents per course with the free trial.'
                          }
                        />
                      );
                    }
                    
                    return renderMaterialContent(selectedMaterial);
                  })()}
                </div>
                
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {selectedMaterial.views || 0} views • {selectedMaterial.completions || 0} completions
                    </div>
                    {!completedMaterials.has(selectedMaterial._id) && (
                      <button
                        onClick={() => handleMarkCompleted(selectedMaterial._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {completedMaterials.has(selectedMaterial._id) && (
                      <div className="flex items-center text-green-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Material</h3>
                <p className="text-gray-500">Choose a material from the sidebar to start learning.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Popup */}
      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        message={upgradeMessage}
      />
    </div>
  );
};

export default CourseView;
