const Course = require('../models/Course');
const Progress = require('../models/Progress');
const SignupUser = require('../models/SignupUser');
const StudySession = require('../models/StudySession');
const Material = require('../models/Material');
const { formatStudyTime, calculateAvgStudyTimePerDay, getStudyTimeBreakdown } = require('../utils/timeFormatter');

exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get enrolled courses with full details
    const student = await SignupUser.findById(studentId).populate({
      path: 'enrolledCourses',
      populate: {
        path: 'facultyId',
        select: 'name email'
      }
    });
    const enrolledCourses = student?.enrolledCourses || [];

    // Get progress data
    const progressDocs = await Progress.find({ studentId });
    
    // Calculate average progress across all enrolled courses
    let avgProgress = 0;
    if (enrolledCourses.length > 0) {
      const totalProgress = progressDocs.reduce((acc, p) => acc + (p.progressPercentage || 0), 0);
      avgProgress = Math.min(Math.round(totalProgress / enrolledCourses.length), 100); // Cap at 100%
    }

    // Get total study time from study sessions
    const totalStudyTime = await StudySession.aggregate([
      { $match: { studentId: studentId, isActive: false } },
      { $group: { _id: null, totalMinutes: { $sum: '$duration' } } }
    ]);
    const studyTimeMinutes = totalStudyTime.length > 0 ? totalStudyTime[0].totalMinutes : 0;
    
    // Get study time breakdown
    const studyTimeBreakdown = getStudyTimeBreakdown(studyTimeMinutes);
    
    // Calculate average study time per day
    const totalStudyDays = progressDocs.reduce((sum, progress) => sum + progress.studyCalendar.length, 0);
    const avgStudyTimePerDay = calculateAvgStudyTimePerDay(studyTimeMinutes, totalStudyDays);

    // Count total completed materials/lectures across all courses
    const totalCompletedMaterials = await Material.aggregate([
      { $match: { courseId: { $in: enrolledCourses.map(c => c._id) } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    const completedMaterials = totalCompletedMaterials.length > 0 ? totalCompletedMaterials[0].count : 0;

    // Count completed lessons from progress
    const totalCompletedLessons = progressDocs.reduce((acc, p) => acc + (p.lessonsCompleted || 0), 0);

    // Get recent activities
    const recentActivities = await StudySession.find({ studentId })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      enrolledCourses: enrolledCourses.length,
      avgProgress,
      totalStudyTime: studyTimeMinutes,
      studyTimeHours: studyTimeBreakdown.totalHours,
      studyTimeFormatted: studyTimeBreakdown.formatted,
      avgStudyTimePerDay: avgStudyTimePerDay,
      completedMaterials,
      completedLessons: totalCompletedLessons,
      recentActivities: recentActivities.map(activity => ({
        id: activity._id,
        type: 'study',
        content: `Studied ${activity.courseId?.title || 'Unknown Course'}`,
        time: activity.createdAt
      })),
      courses: enrolledCourses,
      studyTimeBreakdown: studyTimeBreakdown
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching student dashboard", 
      error: error.message 
    });
  }
};
