const router = require('express').Router();
const auth = require('../middleware/auth');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Progress = require('../models/Progress');
const SignupUser = require('../models/SignupUser');

// POST /api/faculty/courses/create (alias for creating a course)
router.post('/courses/create', auth('faculty'), async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, facultyId: req.user.id });
    return res.status(201).json({ success: true, course });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/faculty/materials (alias for uploading material)
router.post('/materials', auth('faculty'), async (req, res) => {
  try {
    const { courseId } = req.body || {};
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required' });
    // Normalize fields to backend schema
    const normalized = {
      courseId,
      uploadedBy: req.user.id,
      type: req.body.type === 'document' ? 'doc' : req.body.type,
      fileURL: req.body.fileUrl || req.body.fileURL,
    };
    if (!normalized.fileURL) return res.status(400).json({ success: false, message: 'fileUrl is required' });
    const material = await Material.create(normalized);
    return res.status(201).json({ success: true, material });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/faculty/dashboard
router.get('/dashboard', auth('faculty'), async (req, res) => {
  try {
    const facultyId = req.user.id;
    const courses = await Course.find({ facultyId }).select('_id').lean();
    const courseIds = courses.map(c => c._id);

    const [materialsCount, progresses] = await Promise.all([
      Material.countDocuments({ courseId: { $in: courseIds } }),
      Progress.find({ courseId: { $in: courseIds } }).lean(),
    ]);

    const totalStudents = new Set(progresses.map(p => String(p.studentId))).size;
    const totalCourses = courseIds.length;
    const avgProgress = progresses.length
      ? Math.round(progresses.reduce((s, p) => s + (p.lessonsCompleted || 0), 0) / progresses.length)
      : 0;

    return res.json({ success: true, overview: { totalStudents, totalCourses, totalMaterials: materialsCount, averageProgress: avgProgress } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/faculty/courses
router.get('/courses', auth('faculty'), async (req, res) => {
  try {
    const facultyId = req.user.id;
    const courses = await Course.find({ facultyId }).lean();
    return res.json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/faculty/courses/:courseId/enrollments
router.get('/courses/:courseId/enrollments', auth('faculty'), async (req, res) => {
  try {
    const { courseId } = req.params;
    // verify ownership
    const course = await Course.findOne({ _id: courseId, facultyId: req.user.id }).lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const progresses = await Progress.find({ courseId }).lean();
    const studentIds = [...new Set(progresses.map(p => String(p.studentId)))];
    const students = await SignupUser.find({ _id: { $in: studentIds } }).select('name email').lean();
    const studentMap = new Map(students.map(s => [String(s._id), s]));

    const enrollments = progresses.map(p => ({
      _id: p._id,
      student: studentMap.get(String(p.studentId)) || { _id: p.studentId },
      enrolledAt: p.createdAt,
      progress: p.lessonsCompleted || 0,
    }));

    return res.json({ success: true, enrollments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;



