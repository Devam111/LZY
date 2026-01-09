// Mock API Configuration - Replace with real backend when ready
// This provides mock responses for development without a backend

// Mock data storage
const mockData = {
  users: [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@student.edu',
      role: 'student',
      studentId: 'STU001',
      institution: 'University of Technology'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      role: 'faculty',
      institution: 'University of Technology',
      department: 'Computer Science'
    }
  ],
  courses: [
    {
      id: '1',
      title: 'Introduction to React',
      description: 'Learn the basics of React development',
      instructor: '2',
      category: 'Programming',
      level: 'Beginner',
      duration: '8 weeks',
      isPublished: true,
      modules: [
        {
          id: '1',
          title: 'Getting Started with React',
          description: 'Learn the fundamentals',
          duration: '2 hours',
          type: 'video',
          order: 1
        },
        {
          id: '2',
          title: 'Components and Props',
          description: 'Building reusable components',
          duration: '3 hours',
          type: 'video',
          order: 2
        }
      ]
    },
    {
      id: '2',
      title: 'Advanced JavaScript',
      description: 'Master modern JavaScript concepts',
      instructor: '2',
      category: 'Programming',
      level: 'Intermediate',
      duration: '6 weeks',
      isPublished: true,
      modules: [
        {
          id: '3',
          title: 'ES6+ Features',
          description: 'Modern JavaScript syntax',
          duration: '2.5 hours',
          type: 'video',
          order: 1
        }
      ]
    }
  ],
  enrollments: [
    {
      id: '1',
      studentId: '1',
      courseId: '1',
      progress: 25,
      enrolledAt: new Date().toISOString()
    },
    {
      id: '2',
      studentId: '1',
      courseId: '2',
      progress: 60,
      enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    }
  ],
  materials: [
    {
      id: '1',
      title: 'React Basics PDF',
      description: 'Complete guide to React fundamentals',
      courseId: '1',
      type: 'document',
      fileUrl: '#',
      uploadedBy: '2',
      isPublished: true
    },
    {
      id: '2',
      title: 'React Components Tutorial',
      description: 'Step-by-step guide to building components',
      courseId: '1',
      type: 'document',
      fileUrl: '#',
      uploadedBy: '2',
      isPublished: true
    },
    {
      id: '3',
      title: 'JavaScript ES6+ Cheat Sheet',
      description: 'Quick reference for modern JavaScript',
      courseId: '2',
      type: 'document',
      fileUrl: '#',
      uploadedBy: '2',
      isPublished: true
    }
  ]
};

// Mock authentication token
let mockToken = null;

// Helper function to simulate API delay
const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get auth token
const getAuthToken = () => {
  return mockToken || localStorage.getItem('token');
};

// Mock API request function
const mockApiRequest = async (endpoint, options = {}) => {
  await simulateDelay();
  
  // Parse the endpoint to determine the action
  const path = endpoint.split('?')[0];
  const method = options.method || 'GET';
  
  try {
    // Authentication endpoints
    if (path === '/auth/register') {
      const userData = JSON.parse(options.body);
      const newUser = {
        id: String(mockData.users.length + 1),
        ...userData,
        role: userData.role || 'student'
      };
      mockData.users.push(newUser);
      mockToken = `mock_token_${newUser.id}`;
      localStorage.setItem('token', mockToken);
      return { success: true, user: newUser, token: mockToken };
    }
    
    if (path === '/auth/login') {
      const credentials = JSON.parse(options.body);
      console.log('Mock API Login attempt:', credentials);
      console.log('Available users:', mockData.users);
      
      const user = mockData.users.find(u => 
        u.email === credentials.email && 
        (credentials.password === 'student123' || credentials.password === 'faculty123')
      );
      
      console.log('Found user:', user);
      
      if (user) {
        mockToken = `mock_token_${user.id}`;
        localStorage.setItem('token', mockToken);
        const response = { success: true, user, token: mockToken };
        console.log('Login successful, returning:', response);
        return response;
      } else {
        console.log('Login failed: Invalid credentials');
        throw new Error('Invalid credentials');
      }
    }
    
    if (path === '/auth/me') {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');
      
      const userId = token.split('_').pop();
      const user = mockData.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      
      return { success: true, user };
    }
    
    // Courses endpoints
    if (path === '/courses' && method === 'GET') {
      return { success: true, courses: mockData.courses };
    }
    
    if (path.startsWith('/courses/') && method === 'GET') {
      const courseId = path.split('/').pop();
      const course = mockData.courses.find(c => c.id === courseId);
      if (!course) throw new Error('Course not found');
      return { success: true, course };
    }
    
    if (path === '/courses' && method === 'POST') {
      const courseData = JSON.parse(options.body);
      const newCourse = {
        id: String(mockData.courses.length + 1),
        ...courseData,
        instructor: '2', // Mock faculty user
        isPublished: false,
        modules: []
      };
      mockData.courses.push(newCourse);
      return { success: true, course: newCourse };
    }
    
    // Enrollments endpoints
    if (path === '/enrollments' && method === 'POST') {
      const { courseId } = JSON.parse(options.body);
      const newEnrollment = {
        id: String(mockData.enrollments.length + 1),
        studentId: '1', // Mock student user
        courseId,
        progress: 0,
        enrolledAt: new Date().toISOString()
      };
      mockData.enrollments.push(newEnrollment);
      return { success: true, enrollment: newEnrollment };
    }
    
    if (path === '/enrollments/my-enrollments') {
      const enrollments = mockData.enrollments.filter(e => e.studentId === '1');
      // Populate course data for each enrollment
      const enrollmentsWithCourses = enrollments.map(enrollment => {
        const course = mockData.courses.find(c => c.id === enrollment.courseId);
        return {
          ...enrollment,
          course: course || { id: enrollment.courseId, title: 'Unknown Course' }
        };
      });
      return { success: true, enrollments: enrollmentsWithCourses };
    }
    
    // Materials endpoints
    if (path.startsWith('/materials/course/') && method === 'GET') {
      const courseId = path.split('/').pop();
      const materials = mockData.materials.filter(m => m.courseId === courseId);
      return { success: true, materials };
    }
    
    if (path === '/materials' && method === 'POST') {
      const materialData = JSON.parse(options.body);
      const newMaterial = {
        id: String(mockData.materials.length + 1),
        ...materialData,
        uploadedBy: '2', // Mock faculty user
        isPublished: true
      };
      mockData.materials.push(newMaterial);
      return { success: true, material: newMaterial };
    }
    
    // Progress endpoints
    if (path === '/progress/student/overview') {
      const enrollments = mockData.enrollments.filter(e => e.studentId === '1');
      const totalProgress = enrollments.reduce((sum, e) => sum + e.progress, 0);
      const avgProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0;
      
      return {
        success: true,
        overview: {
          totalCourses: enrollments.length,
          averageProgress: avgProgress,
          completedCourses: enrollments.filter(e => e.progress === 100).length
        }
      };
    }
    
    // Health check
    if (path === '/health') {
      return { success: true, status: 'healthy', timestamp: new Date().toISOString() };
    }
    
    // Default response for unknown endpoints
    return { success: true, message: 'Mock endpoint reached', endpoint };
    
  } catch (error) {
    console.error('Mock API Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: async (userData) => {
    return mockApiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return mockApiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getProfile: async () => {
    return mockApiRequest('/auth/me');
  },

  updateProfile: async (profileData) => {
    return mockApiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (passwordData) => {
    return mockApiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },
};

// Courses API
export const coursesAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return mockApiRequest(`/courses?${params}`);
  },

  getById: async (courseId) => {
    return mockApiRequest(`/courses/${courseId}`);
  },

  create: async (courseData) => {
    return mockApiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },

  update: async (courseId, courseData) => {
    return mockApiRequest(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },

  delete: async (courseId) => {
    return mockApiRequest(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  },

  getMyCourses: async () => {
    return mockApiRequest('/courses/instructor/my-courses');
  },

  togglePublish: async (courseId) => {
    return mockApiRequest(`/courses/${courseId}/publish`, {
      method: 'POST',
    });
  },
};

// Enrollments API
export const enrollmentsAPI = {
  enroll: async (courseId) => {
    return mockApiRequest('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  getMyEnrollments: async () => {
    return mockApiRequest('/enrollments/my-enrollments');
  },

  getById: async (enrollmentId) => {
    return mockApiRequest(`/enrollments/${enrollmentId}`);
  },

  updateProgress: async (enrollmentId, progressData) => {
    return mockApiRequest(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
  },

  drop: async (enrollmentId) => {
    return mockApiRequest(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  },

  getCourseEnrollments: async (courseId) => {
    return mockApiRequest(`/enrollments/course/${courseId}/students`);
  },
};

// Materials API
export const materialsAPI = {
  getCourseMaterials: async (courseId) => {
    return mockApiRequest(`/materials/course/${courseId}`);
  },

  getById: async (materialId) => {
    return mockApiRequest(`/materials/${materialId}`);
  },

  upload: async (materialData) => {
    return mockApiRequest('/materials', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });
  },

  update: async (materialId, materialData) => {
    return mockApiRequest(`/materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });
  },

  delete: async (materialId) => {
    return mockApiRequest(`/materials/${materialId}`, {
      method: 'DELETE',
    });
  },

  togglePublish: async (materialId) => {
    return mockApiRequest(`/materials/${materialId}/publish`, {
      method: 'POST',
    });
  },

  recordDownload: async (materialId) => {
    return mockApiRequest(`/materials/${materialId}/download`, {
      method: 'POST',
    });
  },

  getMyMaterials: async () => {
    return mockApiRequest('/materials/instructor/my-materials');
  },
};

// Progress API
export const progressAPI = {
  getStudentOverview: async () => {
    return mockApiRequest('/progress/student/overview');
  },

  getCourseProgress: async (courseId) => {
    return mockApiRequest(`/progress/student/course/${courseId}`);
  },

  getCourseAnalytics: async (courseId) => {
    return mockApiRequest(`/progress/instructor/course/${courseId}`);
  },

  getInstructorOverview: async () => {
    return mockApiRequest('/progress/instructor/overview');
  },

  getStudentAnalytics: async (studentId) => {
    return mockApiRequest(`/progress/analytics/student/${studentId}`);
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return mockApiRequest('/health');
  },
};

export default {
  auth: authAPI,
  courses: coursesAPI,
  enrollments: enrollmentsAPI,
  materials: materialsAPI,
  progress: progressAPI,
  health: healthAPI,
}; 