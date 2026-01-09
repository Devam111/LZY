const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');

exports.getAdminDashboard = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const totalContentItems = await Course.aggregate([
      { $group: { _id: null, count: { $sum: { $size: "$content" } } } }
    ]);
    const avgProgress = await Progress.aggregate([
      { $group: { _id: null, avg: { $avg: "$percentage" } } }
    ]);

    res.json({
      totalStudents,
      totalCourses,
      totalContentItems: totalContentItems[0]?.count || 0,
      avgProgress: avgProgress[0]?.avg || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin dashboard", error });
  }
};
