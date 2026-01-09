const router = require('express').Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const SignupUser = require('../models/SignupUser');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Progress = require('../models/Progress');

// GET /api/student/dashboard
router.get('/dashboard', auth('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await SignupUser.findById(studentId).populate('enrolledCourses').lean();
    const enrolledCourses = student?.enrolledCourses || [];

    const progressDocs = await Progress.find({ studentId }).lean();
    const avgProgress = progressDocs.length
      ? Math.min(Math.round(progressDocs.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / Math.max(enrolledCourses.length, 1)), 100)
      : 0;
    const studyTime = progressDocs.reduce((acc, p) => acc + (p.avgStudyTime || 0), 0);
    const completedCourses = progressDocs.filter(p => (p.lessonsCompleted || 0) >= 100).length;

    return res.json({
      enrolledCourses,
      avgProgress,
      studyTime,
      completedCourses
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching student dashboard', error: error.message });
  }
});

// POST /api/student/enroll { courseId }
router.post('/enroll', auth('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body || {};
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: 'Valid courseId is required' });
    }

    const [user, course] = await Promise.all([
      SignupUser.findById(studentId),
      Course.findById(courseId),
    ]);

    if (!course) return res.status(404).json({ message: 'Course not found' });

    // add enrollment if not already present
    if (!user.enrolledCourses.some(id => id.toString() === courseId)) {
      user.enrolledCourses.push(course._id);
      await user.save();
    }
    if (!course.enrolledStudents.some(id => id.toString() === studentId)) {
      course.enrolledStudents.push(user._id);
      await course.save();
    }

    // ensure a Progress doc exists
    const progress = await Progress.findOneAndUpdate(
      { studentId: user._id, courseId: course._id },
      { $setOnInsert: { lessonsCompleted: 0, quizzesTaken: 0, avgStudyTime: 0 } },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, enrollment: { course: course._id, student: user._id, progress: progress.lessonsCompleted || 0, enrolledAt: new Date() } });
  } catch (error) {
    return res.status(500).json({ message: 'Error enrolling in course', error: error.message });
  }
});

// GET /api/student/enrollments
router.get('/enrollments', auth('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await SignupUser.findById(studentId).populate('enrolledCourses').lean();
    const enrolledCourses = student?.enrolledCourses || [];
    const progressDocs = await Progress.find({ studentId }).lean();
    const courseIdToProgress = new Map(progressDocs.map(p => [p.courseId.toString(), p]));

    const enrollments = enrolledCourses.map(c => ({
      _id: c._id,
      courseId: c._id,
      course: c,
      progress: courseIdToProgress.get(c._id.toString())?.lessonsCompleted || 0,
      enrolledAt: c.createdAt,
      status: 'active',
      completedLessons: courseIdToProgress.get(c._id.toString())?.lessonsCompleted || 0,
    }));

    return res.json({ success: true, enrollments });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
  }
});

// GET /api/student/materials/:courseId (alias for convenience)
router.get('/materials/:courseId', auth('student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const materials = await Material.find({ courseId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, materials });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching course materials', error: error.message });
  }
});

module.exports = router;


