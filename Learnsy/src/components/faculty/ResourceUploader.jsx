import React, { useState, useRef, useEffect } from 'react';
import { coursesAPI } from '../../api/courses.js';
import { materialsAPI } from '../../api/materials.js';

const ResourceUploader = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [resourceType, setResourceType] = useState('video');
  const fileInputRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);

  // Load courses on component mount and apply any upload preset
  useEffect(() => {
    loadCourses();
    try {
      const raw = localStorage.getItem('uploadPreset');
      if (raw) {
        const preset = JSON.parse(raw);
        if (preset?.courseId) {
          setSelectedCourse(String(preset.courseId));
          loadCourseMaterials(String(preset.courseId));
        }
        if (preset?.type) setResourceType(preset.type);
        localStorage.removeItem('uploadPreset');
      }
    } catch (e) {
      console.error('Failed to apply upload preset', e);
    }
  }, []);

  // Load materials when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadCourseMaterials(selectedCourse);
    } else {
      setCourseMaterials([]);
    }
  }, [selectedCourse]);

  // Listen for materials changes to refresh
  useEffect(() => {
    const handleMaterialsChanged = () => {
      if (selectedCourse) {
        loadCourseMaterials(selectedCourse);
      }
    };
    window.addEventListener('materials-changed', handleMaterialsChanged);
    return () => window.removeEventListener('materials-changed', handleMaterialsChanged);
  }, [selectedCourse]);

  const loadCourseMaterials = async (courseId) => {
    if (!courseId) return;
    try {
      const response = await materialsAPI.getFacultyCourseMaterials(courseId);
      const materials = Array.isArray(response)
        ? response
        : (response?.materials || (response?.success ? response.materials : []));
      
      // Sort by creation date (newest first)
      const sortedMaterials = materials.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setCourseMaterials(sortedMaterials);
    } catch (error) {
      console.error('Error loading course materials:', error);
      setCourseMaterials([]);
    }
  };

  const loadCourses = async () => {
    try {
      const coursesResponse = await coursesAPI.getMyCourses();
      const list = Array.isArray(coursesResponse)
        ? coursesResponse
        : (coursesResponse?.courses || []);
      setCourses(list);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
    }
  };

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    questions: []
  });

  const getAcceptForType = (type) => {
    switch (type) {
      case 'video':
        return 'video/*';
      case 'documentation':
        return '.pdf,.ppt,.pptx';
      case 'roadmap':
        return '.png,.jpg,.jpeg,.pdf';
      case 'quiz':
        return '.json';
      case 'notes':
      default:
        return '.pdf,.doc,.docx,.txt,.md';
    }
  };

  const isFileAllowed = (file, type) => {
    const name = (file?.name || '').toLowerCase();
    const mime = (file?.type || '').toLowerCase();
    if (type === 'video') {
      return mime.startsWith('video/');
    }
    if (type === 'documentation') {
      return name.endsWith('.pdf') || name.endsWith('.ppt') || name.endsWith('.pptx') ||
             mime === 'application/pdf' || mime === 'application/vnd.ms-powerpoint' ||
             mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
    if (type === 'roadmap') {
      return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.pdf') ||
             mime.startsWith('image/') || mime === 'application/pdf';
    }
    if (type === 'quiz') {
      return name.endsWith('.json') || mime === 'application/json';
    }
    // notes (fallback)
    return true;
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const disallowed = [];
      for (const file of files) {
        if (!isFileAllowed(file, resourceType)) {
          disallowed.push(file.name);
          continue;
        }
        
        // Map resource type to Material model type
        // Material model supports: 'video', 'text', 'pdf', 'image', 'link', 'quiz', 'assignment'
        let materialType = resourceType;
        if (resourceType === 'notes' || resourceType === 'documentation') {
          // For PDF files, use 'pdf' type; for other document types, use 'text'
          const fileName = file.name.toLowerCase();
          if (fileName.endsWith('.pdf')) {
            materialType = 'pdf';
          } else {
            materialType = 'text';
          }
        } else if (resourceType === 'roadmap') {
          const fileName = file.name.toLowerCase();
          if (fileName.endsWith('.pdf')) {
            materialType = 'pdf';
          } else {
            materialType = 'image';
          }
        } else if (resourceType === 'quiz') {
          materialType = 'quiz';
        }
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('description', `Uploaded ${resourceType}: ${file.name}`);
        formData.append('type', materialType);
        formData.append('courseId', selectedCourse);
        
        console.log('Uploading file:', file.name, 'to course:', selectedCourse, 'type:', materialType);
        
        // Upload material
        const response = await materialsAPI.upload(formData);
        console.log('Upload response:', response);
        const material = response?.material || response || {};
        
        // Construct file URL from the file path or use provided URL
        const fileUrl = material?.fileUrl || material?.url || 
          (material?.filePath 
            ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/materials/${material.filePath.split('/').pop()}`
            : null);
        
        const newFile = {
          id: material._id || material.id || Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          status: 'uploaded',
          materialId: material._id || material.id,
          fileUrl: fileUrl,
          previewUrl: URL.createObjectURL(file)
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
      }
      
      if (disallowed.length > 0) {
        alert(`Some files were skipped due to type restrictions:\n- ${disallowed.join('\n- ')}`);
      }
      alert('Files uploaded successfully!');
      try {
        // Notify dashboard to refresh stats and recent activities
        window.dispatchEvent(new Event('materials-changed'));
        // Also refresh courses in case counts or timestamps changed
        window.dispatchEvent(new Event('courses-changed'));
        // Reload course materials to show newly uploaded files
        if (selectedCourse) {
          loadCourseMaterials(selectedCourse);
        }
        // Clear uploaded files list after successful upload (materials are now in courseMaterials)
        setUploadedFiles([]);
      } catch (_) {}
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload files. Please try again.';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleFileUpload({ target: { files } });
  };

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
  };

  const detectKind = (name = '', mime = '') => {
    const lower = name.toLowerCase();
    if (mime.startsWith('video/') || lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) return 'video';
    if (mime.startsWith('image/') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image';
    if (lower.endsWith('.pdf')) return 'pdf';
    return 'other';
  };

  const addQuizQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [...quizData.questions, {
        id: Date.now(),
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }]
    });
  };

  const updateQuizQuestion = (questionId, field, value) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    });
  };

  const removeQuizQuestion = (questionId) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.filter(q => q.id !== questionId)
    });
  };

  const renderUploadTab = () => (
    <div className="space-y-6">
      {/* Course Selection */}
      <div>
        <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
          Select Course
        </label>
        <select
          id="course"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
        >
          <option value="" className="text-gray-500">Choose a course</option>
          {courses.map(course => (
            <option key={course._id || course.id} value={course._id || course.id} className="text-black">{course.title}</option>
          ))}
        </select>
      </div>

      {/* Resource Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resource Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { id: 'video', label: 'Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
            { id: 'notes', label: 'Notes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'roadmap', label: 'Roadmap', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'documentation', label: 'Documentation', icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2' },
            { id: 'quiz', label: 'Quiz', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setResourceType(type.id)}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                resourceType === type.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon} />
              </svg>
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-4">
          <p className="text-lg font-medium text-gray-900">Uploaded your {resourceType}</p>
          <p className="text-sm text-gray-500">Drag and drop files here, or click to browse</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Choose Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept={getAcceptForType(resourceType)}
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-700">Uploading files...</span>
          </div>
        </div>
      )}

      {/* Course Materials - Show all uploaded materials for selected course */}
      {selectedCourse && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Course Materials ({courseMaterials.length})
              </h3>
              <button
                onClick={() => loadCourseMaterials(selectedCourse)}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                title="Refresh materials"
              >
                Refresh
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">All uploaded resources for this course</p>
          </div>
          <div className="divide-y divide-gray-200">
            {courseMaterials.length > 0 ? (
              courseMaterials.map((material) => {
                const fileUrl = material.fileUrl || material.url || 
                  (material.filePath ? `/uploads/materials/${material.filePath.split('/').pop()}` : null);
                
                return (
                  <div key={material._id || material.id} className="px-6 py-4 flex items-center justify-between">
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
                        <p className="text-xs text-gray-500 capitalize">{material.type || 'document'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploaded: {new Date(material.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {fileUrl && (
                        <a
                          href={fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No materials uploaded yet for this course.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recently Uploaded Files (from current session) */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recently Uploaded (This Session)</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      const url = file.fileUrl || file.previewUrl;
                      if (!url) return;
                      const kind = detectKind(file.name, file.type);
                      // Inline preview for video/images/pdf for better UX
                      if (kind === 'video' || kind === 'image' || kind === 'pdf') {
                        setPreviewItem({ url, kind, name: file.name });
                      } else {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-6" onClick={() => setPreviewItem(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="text-sm font-medium text-gray-900 truncate">{previewItem.name}</h4>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setPreviewItem(null)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="bg-black/5 flex items-center justify-center" style={{height:'70vh'}}>
              {previewItem.kind === 'video' && (
                <video src={previewItem.url} controls className="max-h-full max-w-full" />
              )}
              {previewItem.kind === 'image' && (
                <img src={previewItem.url} alt={previewItem.name} className="max-h-full max-w-full" />
              )}
              {previewItem.kind === 'pdf' && (
                <iframe src={previewItem.url} title="preview" className="w-full h-full" />
              )}
            </div>
            <div className="px-4 py-3 border-t flex justify-end">
              <a href={previewItem.url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700">Open in new tab</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuizTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Quiz</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="quizTitle" className="block text-sm font-medium text-gray-700">
              Quiz Title
            </label>
            <input
              type="text"
              id="quizTitle"
              value={quizData.title}
              onChange={(e) => setQuizData({...quizData, title: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter quiz title"
            />
          </div>
          
          <div>
            <label htmlFor="quizDescription" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="quizDescription"
              value={quizData.description}
              onChange={(e) => setQuizData({...quizData, description: e.target.value})}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter quiz description"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900">Questions</h4>
            <button
              onClick={addQuizQuestion}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {quizData.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="text-sm font-medium text-gray-900">Question {index + 1}</h5>
                  <button
                    onClick={() => removeQuizQuestion(question.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuizQuestion(question.id, 'question', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-3 text-black"
                  placeholder="Enter question"
                />
                
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => updateQuizQuestion(question.id, 'correctAnswer', optionIndex)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...question.options];
                          newOptions[optionIndex] = e.target.value;
                          updateQuizQuestion(question.id, 'options', newOptions);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {quizData.questions.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Create Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Resources</h2>
        <p className="text-gray-600">Upload videos, notes, roadmaps, documentation, and create quizzes</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload Content
          </button>
        </nav>
      </div>

      {/* Content */}
      {renderUploadTab()}
    </div>
  );
};

export default ResourceUploader;
