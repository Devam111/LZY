import React, { useState, useEffect, useRef } from 'react';
import { coursesAPI } from '../../api/courses.js';
import { materialsAPI } from '../../api/materials.js';
import { enrollmentsAPI } from '../../api/enrollments.js';

const CourseManager = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseMaterials, setSelectedCourseMaterials] = useState([]);
  const [selectedCourseEnrollments, setSelectedCourseEnrollments] = useState([]);
  const [showCourseOverview, setShowCourseOverview] = useState(false);
  const [openEditMenuCourseId, setOpenEditMenuCourseId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'Programming',
    level: 'Beginner',
    duration: '',
    modules: 1
  });
  const editMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editMenuRef.current && !editMenuRef.current.contains(event.target)) {
        setOpenEditMenuCourseId(null);
      }
    };
    if (openEditMenuCourseId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openEditMenuCourseId]);

  // Load courses on component mount and refresh on changes
  useEffect(() => {
    loadCourses();
    const onCoursesChanged = () => loadCourses();
    const onMaterialsChanged = () => loadCourses();
    window.addEventListener('courses-changed', onCoursesChanged);
    window.addEventListener('materials-changed', onMaterialsChanged);
    return () => {
      window.removeEventListener('courses-changed', onCoursesChanged);
      window.removeEventListener('materials-changed', onMaterialsChanged);
    };
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      // Set course as published based on checkbox selection
      const courseData = {
        ...newCourse,
        isPublished: newCourse.publishImmediately !== false // Default to true if not specified
      };
      const response = await coursesAPI.create(courseData);
      if (response && response.success) {
        setShowCreateModal(false);
        setNewCourse({
          title: '',
          description: '',
          category: 'Programming',
          level: 'Beginner',
          duration: '',
          modules: 1
        });
        loadCourses(); // Reload courses
        const message = courseData.isPublished 
          ? 'Course created and published successfully! Students can now enroll in this course.'
          : 'Course created successfully! Use the Publish button to make it visible to students.';
        alert(message);
      } else {
        alert('Failed to create course. Please try again.');
      }
    } catch (error) {
      console.error('Create course error:', error);
      alert('Failed to create course. Please try again.');
    }
  };

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const coursesResponse = await coursesAPI.getMyCourses();
      if (coursesResponse && coursesResponse.success) {
        const list = coursesResponse.courses || [];
        setCourses(list);
        // Build recent activities similar to FacultyDashboard
        const activities = [];
        for (const course of list) {
          try {
            const [materialsResp, enrollmentsResp] = await Promise.all([
              materialsAPI.getCourseMaterials(course._id || course.id),
              enrollmentsAPI.getCourseEnrollments(course._id || course.id)
            ]);
            const materials = Array.isArray(materialsResp) ? materialsResp : (materialsResp?.materials || []);
            const enrollments = Array.isArray(enrollmentsResp) ? enrollmentsResp : (enrollmentsResp?.enrollments || []);
            materials.slice(0, 2).forEach((m) => {
              activities.push({
                id: m._id || `${course._id}-m-${m.title}`,
                type: 'upload',
                content: `Uploaded ${m.type}: ${m.title}`,
                time: new Date(m.createdAt).toLocaleDateString(),
                data: { materialTitle: m.title, materialType: m.type, fileUrl: m.fileUrl, courseTitle: course.title }
              });
            });
            enrollments.slice(0, 1).forEach((e) => {
              activities.push({
                id: e._id || `${course._id}-e-${e.student?.name}`,
                type: 'progress',
                content: `Student ${e.student?.name || 'Unknown'} enrolled in ${course.title}`,
                time: new Date(e.enrolledAt).toLocaleDateString(),
                data: { studentName: e.student?.name || 'Unknown', enrolledAt: e.enrolledAt, progress: e.progress || 0, courseTitle: course.title }
              });
            });
          } catch (_) {}
        }
        setRecentActivities(activities.slice(0, 6));
      } else {
        setCourses([]);
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };
  const goToUpload = (course, type) => {
    try {
      const preset = { courseId: course._id || course.id, type };
      localStorage.setItem('uploadPreset', JSON.stringify(preset));
      if (typeof window.__openUpload === 'function') {
        window.__openUpload();
      } else {
        window.location.hash = '#upload';
        window.dispatchEvent(new Event('open-upload'));
      }
      // Optionally scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Failed to set upload preset', e);
    }
  };

  const openCourseDetails = async (course) => {
    try {
      setSelectedCourse(course);
      setIsDetailsOpen(true);
      setShowCourseOverview(false);
      const [materialsResp, enrollmentsResp] = await Promise.all([
        materialsAPI.getCourseMaterials(course._id || course.id),
        enrollmentsAPI.getCourseEnrollments(course._id || course.id)
      ]);
      const materials = Array.isArray(materialsResp) ? materialsResp : (materialsResp?.materials || []);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      const response = await coursesAPI.togglePublish(course._id || course.id);
      if (response && response.success) {
        // Reload courses to reflect the change
        loadCourses();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Management</h2>
          <p className="text-gray-600">Create and manage your courses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Course
        </button>
      </div>

      {/* Recent Activities (same data model as dashboard) */}
      {recentActivities.length > 0 && (
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadCourses}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(course.status)}`}>
                    {course.status}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{course.description}</p>
              
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
                  <p className="text-sm font-medium text-gray-900">{course.duration}</p>
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
                  <button type="button" onClick={() => setOpenEditMenuCourseId(openEditMenuCourseId === (course._id || course.id) ? null : (course._id || course.id))} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                    Edit
                  </button>
                  {openEditMenuCourseId === (course._id || course.id) && (
                    <div ref={editMenuRef} className="absolute right-0 top-full mt-2 bg-white border rounded-md shadow-lg z-50 w-44">
                      <button type="button" onClick={() => { setOpenEditMenuCourseId(null); goToUpload(course, 'video'); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Upload Video</button>
                      <button type="button" onClick={() => { setOpenEditMenuCourseId(null); goToUpload(course, 'documentation'); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Upload Document</button>
                    </div>
                  )}
                  <button onClick={() => openCourseDetails(course)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Details Modal */}
      {isDetailsOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mt-16">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedCourse.title}</h3>
                <p className="text-sm text-gray-500">{selectedCourse.description}</p>
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
                  <p className="text-lg font-semibold text-gray-900">{selectedCourse.progress || 0}%</p>
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

              {/* Materials section removed as per requirement */}
            </div>

            <div className="px-6 py-4 border-t flex justify-between">
              <button onClick={() => setShowCourseOverview(!showCourseOverview)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">{showCourseOverview ? 'Hide Overview' : 'View Overview'}</button>
              <button onClick={closeCourseDetails} className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 text-sm font-medium">Close</button>
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
                      <p className="text-lg font-semibold text-gray-900">{selectedCourse.progress || 0}%</p>
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

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Course</h3>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Course Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Programming">Programming</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                    Level
                  </label>
                  <select
                    id="level"
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <input
                      type="text"
                      id="duration"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 6 weeks"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="modules" className="block text-sm font-medium text-gray-700">
                      Modules
                    </label>
                    <input
                      type="number"
                      id="modules"
                      value={newCourse.modules}
                      onChange={(e) => setNewCourse({...newCourse, modules: parseInt(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="publishImmediately"
                    checked={newCourse.publishImmediately !== false}
                    onChange={(e) => setNewCourse({...newCourse, publishImmediately: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="publishImmediately" className="ml-2 block text-sm text-gray-700">
                    Publish immediately (make visible to students)
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManager;
