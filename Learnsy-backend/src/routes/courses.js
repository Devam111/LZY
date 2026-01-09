const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Course = require('../models/Course');
const Material = require('../models/Material');

// Apply authentication middleware to all routes
router.use(auth());

// GET /api/courses - Get all courses with filtering
router.get('/', async (req, res) => {
  try {
    const { isPublished, category, level, search } = req.query;
    const studentId = req.user.id;
    
    // Build query
    let query = {};
    
    // Filter by published status (default to published courses for students)
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    } else if (req.user.role === 'student') {
      query.isPublished = true; // Students only see published courses
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by level
    if (level) {
      query.level = level;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    const courses = await Course.find(query)
      .populate('facultyId', 'name email institution')
      .sort({ createdAt: -1 });
    
    // For students, check enrollment status
    if (req.user.role === 'student') {
      const Enrollment = require('../models/Enrollment');
      const enrollments = await Enrollment.find({ 
        studentId, 
        status: 'active' 
      }).select('courseId');
      
      const enrolledCourseIds = enrollments.map(e => e.courseId.toString());
      
      const coursesWithEnrollment = courses.map(course => ({
        ...course.toObject(),
        isEnrolled: enrolledCourseIds.includes(course._id.toString())
      }));
      
      console.log(`📚 Returning ${coursesWithEnrollment.length} courses for student ${req.user.id}`);
      console.log('Courses:', coursesWithEnrollment.map(c => ({ title: c.title, isEnrolled: c.isEnrolled })));
      
      return res.json({
        success: true,
        courses: coursesWithEnrollment
      });
    }
    
    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

// GET /api/courses/my-courses - Get faculty's courses
router.get('/my-courses', async (req, res) => {
  try {
    const facultyId = req.user.id;
    const courses = await Course.find({ facultyId }).populate('facultyId', 'name email').sort({ createdAt: -1 });
    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

// GET /api/courses/:id - Get course by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('facultyId', 'name email institution')
      .populate('materials')
      .populate('quizzes');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // For students, check enrollment status
    if (req.user.role === 'student') {
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: course._id,
        status: 'active'
      });

      const courseWithEnrollment = {
        ...course.toObject(),
        isEnrolled: !!enrollment,
        enrollment: enrollment ? {
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status
        } : null
      };

      return res.json({
        success: true,
        course: courseWithEnrollment
      });
    }

    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course'
    });
  }
});

// POST /api/courses - Create new course
router.post('/', async (req, res) => {
  try {
    const { modules, ...otherData } = req.body;
    
    // Transform modules from number to array of module objects
    let modulesArray = [];
    if (modules && typeof modules === 'number') {
      modulesArray = Array.from({ length: modules }, (_, index) => ({
        title: `Module ${index + 1}`,
        description: `Description for Module ${index + 1}`,
        duration: '1 hour'
      }));
    } else if (Array.isArray(modules)) {
      modulesArray = modules;
    }
    
    const courseData = {
      ...otherData,
      modules: modulesArray,
      facultyId: req.user.id
    };
    
    const course = await Course.create(courseData);
    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
});

// PUT /api/courses/:id - Update course
router.put('/:id', async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, facultyId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating course'
    });
  }
});

// POST /api/courses/:id/publish - Toggle course publish status
router.post('/:id/publish', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      facultyId: req.user.id
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }
    
    course.isPublished = !course.isPublished;
    await course.save();
    
    res.json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        isPublished: course.isPublished
      },
      message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling course publish status'
    });
  }
});

// DELETE /api/courses/:id - Delete course
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      facultyId: req.user.id
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
});

module.exports = router;