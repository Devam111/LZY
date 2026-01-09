const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const SignupUser = require('../models/SignupUser');

// Get all enrollments for a student
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const enrollments = await Enrollment.find({ 
      studentId: studentId,
      status: 'active'
    })
    .populate('courseId', 'title description category level duration price thumbnail modules')
    .populate('studentId', 'name email')
    .sort({ enrolledAt: -1 });

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await Progress.findOne({ 
          studentId: enrollment.studentId._id,
          courseId: enrollment.courseId._id
        });

        return {
          _id: enrollment._id,
          course: enrollment.courseId,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status,
          progress: progress ? {
            lessonsCompleted: progress.lessonsCompleted,
            totalLessons: progress.totalLessons,
            percentage: progress.progressPercentage,
            studyTimeMinutes: progress.totalStudyTime,
            lastAccessed: progress.lastAccessed,
            streak: progress.streak
          } : {
            lessonsCompleted: 0,
            totalLessons: enrollment.courseId.totalLessons || 0,
            percentage: 0,
            studyTimeMinutes: 0,
            lastAccessed: enrollment.enrolledAt,
            streak: { current: 0, longest: 0 }
          }
        };
      })
    );

    res.json({
      success: true,
      enrollments: enrollmentsWithProgress,
      count: enrollmentsWithProgress.length
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments'
    });
  }
};

// Enroll in a course
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }
    
    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: studentId,
      courseId: courseId,
      status: 'active'
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      studentId: studentId,
      courseId: courseId,
      progress: {
        totalLessons: course.totalLessons || 0
      }
    });

    await enrollment.save();
    
    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: studentId },
      $inc: { enrollmentCount: 1 }
    });
    
    // Create initial progress record
    const progress = new Progress({
      studentId: studentId,
      courseId: courseId,
      enrollmentId: enrollment._id,
      totalLessons: course.totalLessons || 0
    });
    await progress.save();
    
    // Populate the enrollment for response
    await enrollment.populate('courseId', 'title description category level duration price thumbnail');
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment: {
        _id: enrollment._id,
        course: enrollment.courseId,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status
      }
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course'
    });
  }
};

// Get enrollment details
const getEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = req.user.id;
    
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      studentId: studentId
    })
    .populate('courseId')
    .populate('studentId', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Get detailed progress
    const progress = await Progress.findOne({
      studentId: studentId,
      courseId: enrollment.courseId._id
    });

    res.json({
      success: true,
      enrollment: {
        _id: enrollment._id,
        course: enrollment.courseId,
        student: enrollment.studentId,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: progress || {
          lessonsCompleted: 0,
          totalLessons: enrollment.courseId.totalLessons || 0,
          percentage: 0,
          studyTimeMinutes: 0
        }
      }
    });
  } catch (error) {
    console.error('Get enrollment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment details'
    });
  }
};

// Update enrollment progress
const updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { lessonsCompleted, studyTimeMinutes } = req.body;
    const studentId = req.user.id;
    
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      studentId: studentId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update progress record
    const progress = await Progress.findOneAndUpdate(
      { studentId: studentId, courseId: enrollment.courseId },
      {
        $set: {
          lessonsCompleted: lessonsCompleted || 0,
          lastAccessed: new Date()
        },
        $inc: {
          totalStudyTime: studyTimeMinutes || 0
        }
      },
      { new: true, upsert: true }
    );

    // Update study streak
    await progress.updateStreak();

    // Update enrollment progress
    enrollment.progress.lessonsCompleted = progress.lessonsCompleted;
    enrollment.progress.percentage = progress.progressPercentage;
    enrollment.progress.lastAccessed = new Date();
    await enrollment.save();

    res.json({
      success: true,
      progress: progress,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress'
    });
  }
};

// Drop enrollment
const dropEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = req.user.id;
    
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      studentId: studentId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update enrollment status
    enrollment.status = 'dropped';
    await enrollment.save();
    
    // Update course enrollment count
    await Course.findByIdAndUpdate(enrollment.courseId, {
      $pull: { enrolledStudents: studentId },
      $inc: { enrollmentCount: -1 }
    });
    
    res.json({
      success: true,
      message: 'Successfully dropped course'
    });
  } catch (error) {
    console.error('Drop enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error dropping course'
    });
  }
};

// Get course enrollments (for faculty)
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const facultyId = req.user.id;
    
    // Verify faculty owns the course
    const course = await Course.findOne({
      _id: courseId,
      facultyId: facultyId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }
    
    // Get all enrollments for this course
    const enrollments = await Enrollment.find({
      courseId: courseId,
      status: 'active'
    })
    .populate('studentId', 'name email institution studentId')
    .sort({ enrolledAt: -1 });

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await Progress.findOne({
          studentId: enrollment.studentId._id,
          courseId: courseId
        });

        return {
          _id: enrollment._id,
          student: enrollment.studentId,
          enrolledAt: enrollment.enrolledAt,
          progress: progress ? {
            lessonsCompleted: progress.lessonsCompleted,
            totalLessons: progress.totalLessons,
            percentage: progress.progressPercentage,
            studyTimeMinutes: progress.totalStudyTime,
            lastAccessed: progress.lastAccessed
          } : {
            lessonsCompleted: 0,
            totalLessons: course.totalLessons || 0,
            percentage: 0,
            studyTimeMinutes: 0,
            lastAccessed: enrollment.enrolledAt
          }
        };
      })
    );
    
    res.json({
      success: true,
      enrollments: enrollmentsWithProgress,
      count: enrollmentsWithProgress.length,
      course: {
        title: course.title,
        totalLessons: course.totalLessons
      }
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course enrollments'
    });
  }
};

module.exports = {
  getMyEnrollments,
  enrollInCourse,
  getEnrollmentDetails,
  updateProgress,
  dropEnrollment,
  getCourseEnrollments
};
