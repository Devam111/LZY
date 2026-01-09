const SignupUser = require('../models/SignupUser');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Progress = require('../models/Progress');
const StudySession = require('../models/StudySession');

// Get faculty dashboard overview
const getFacultyOverview = async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    // Get faculty's courses
    const courses = await Course.find({ facultyId: facultyId }).populate('facultyId');
    
    // Calculate stats
    let totalStudents = 0;
    let totalMaterials = 0;
    let totalStudyTime = 0;
    let avgProgress = 0;
    
    for (const course of courses) {
      // Get enrollments for this course
      const enrollments = await SignupUser.find({ 
        enrolledCourses: course._id 
      }).select('_id');
      
      totalStudents += enrollments.length;
      
      // Get materials for this course
      const materials = await Material.find({ courseId: course._id });
      totalMaterials += materials.length;
      
      // Get progress for this course
      const progressRecords = await Progress.find({ courseId: course._id });
      if (progressRecords.length > 0) {
        const courseAvgProgress = progressRecords.reduce((sum, p) => sum + (p.lessonsCompleted || 0), 0) / progressRecords.length;
        avgProgress += courseAvgProgress;
      }
      
      // Get study sessions for this course
      const studySessions = await StudySession.find({ courseId: course._id });
      totalStudyTime += studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    }
    
    // Calculate average progress across all courses
    avgProgress = courses.length > 0 ? Math.round(avgProgress / courses.length) : 0;
    
    // Get recent activities (study sessions from last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = await StudySession.find({
      courseId: { $in: courses.map(c => c._id) },
      startTime: { $gte: sevenDaysAgo }
    }).populate('studentId', 'name').populate('courseId', 'title').sort({ startTime: -1 }).limit(10);
    
    res.json({
      success: true,
      overview: {
        totalCourses: courses.length,
        totalStudents,
        totalMaterials,
        avgProgress,
        totalStudyTime,
        recentActivities: recentSessions.map(session => ({
          id: session._id,
          studentName: session.studentId?.name || 'Unknown Student',
          courseName: session.courseId?.title || 'Unknown Course',
          activity: session.activity,
          duration: session.duration,
          startTime: session.startTime
        }))
      }
    });
  } catch (error) {
    console.error('Faculty overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty overview'
    });
  }
};

// Get faculty courses with detailed stats
const getFacultyCourses = async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    const courses = await Course.find({ facultyId: facultyId }).sort({ createdAt: -1 });
    
    // Get detailed stats for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        // Get enrollments
        const enrollments = await SignupUser.find({ 
          enrolledCourses: course._id 
        }).select('_id name email');
        
        // Get materials
        const materials = await Material.find({ courseId: course._id });
        
        // Get progress
        const progressRecords = await Progress.find({ courseId: course._id });
        const avgProgress = progressRecords.length > 0 
          ? Math.round(progressRecords.reduce((sum, p) => sum + (p.lessonsCompleted || 0), 0) / progressRecords.length)
          : 0;
        
        return {
          ...course.toObject(),
          enrollmentCount: enrollments.length,
          materialCount: materials.length,
          avgProgress,
          enrollments: enrollments.map(e => ({
            _id: e._id,
            name: e.name,
            email: e.email
          }))
        };
      })
    );
    
    res.json({
      success: true,
      courses: coursesWithStats
    });
  } catch (error) {
    console.error('Faculty courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty courses'
    });
  }
};

// Get course analytics
const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const facultyId = req.user.id;
    
    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, facultyId: facultyId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get enrollments
    const enrollments = await SignupUser.find({ 
      enrolledCourses: courseId 
    }).select('_id name email');
    
    // Get materials
    const materials = await Material.find({ courseId });
    
    // Get progress records
    const progressRecords = await Progress.find({ courseId });
    
    // Get study sessions
    const studySessions = await StudySession.find({ courseId });
    
    // Calculate analytics
    const totalStudyTime = studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgProgress = progressRecords.length > 0 
      ? Math.round(progressRecords.reduce((sum, p) => sum + (p.lessonsCompleted || 0), 0) / progressRecords.length)
      : 0;
    
    // Get progress distribution
    const progressDistribution = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0
    };
    
    progressRecords.forEach(record => {
      const progress = record.lessonsCompleted || 0;
      if (progress <= 25) progressDistribution['0-25%']++;
      else if (progress <= 50) progressDistribution['26-50%']++;
      else if (progress <= 75) progressDistribution['51-75%']++;
      else progressDistribution['76-100%']++;
    });
    
    res.json({
      success: true,
      analytics: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          createdAt: course.createdAt
        },
        stats: {
          totalEnrollments: enrollments.length,
          totalMaterials: materials.length,
          totalStudyTime,
          avgProgress,
          progressDistribution
        },
        enrollments: enrollments.map(e => ({
          _id: e._id,
          name: e.name,
          email: e.email
        })),
        materials: materials.map(m => ({
          _id: m._id,
          type: m.type,
          fileURL: m.fileURL,
          createdAt: m.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course analytics'
    });
  }
};

module.exports = {
  getFacultyOverview,
  getFacultyCourses,
  getCourseAnalytics
};
