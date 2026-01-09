

const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const SignupUser = require('../models/SignupUser');
const { formatStudyTime, calculateAvgStudyTimePerDay, getStudyTimeBreakdown } = require('../utils/timeFormatter');

// Get student overview with aggregated stats
const getStudentOverview = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get all active enrollments
    const enrollments = await Enrollment.find({
      studentId: studentId,
      status: 'active'
    }).populate('courseId', 'title totalLessons');

    // Get all progress records
    const progressRecords = await Progress.find({
      studentId: studentId
    }).populate('courseId', 'title');

    // Calculate aggregated stats
    const enrolledCourses = enrollments.length;
    const completedMaterials = progressRecords.reduce((sum, progress) => sum + progress.lessonsCompleted, 0);
    const totalStudyTimeMinutes = progressRecords.reduce((sum, progress) => sum + progress.totalStudyTime, 0);
    
    // Calculate average progress
    let avgProgress = 0;
    if (progressRecords.length > 0) {
      const totalProgress = progressRecords.reduce((sum, progress) => sum + progress.progressPercentage, 0);
      avgProgress = Math.round(totalProgress / progressRecords.length);
    }

    // Get current streak
    const currentStreak = progressRecords.length > 0 ? 
      Math.max(...progressRecords.map(p => p.streak.current)) : 0;

    // Get longest streak
    const longestStreak = progressRecords.length > 0 ? 
      Math.max(...progressRecords.map(p => p.streak.longest)) : 0;

    // Calculate total study days
    const totalStudyDays = progressRecords.reduce((sum, progress) => sum + progress.studyCalendar.length, 0);
    
    // Calculate average study time per day
    const avgStudyTimePerDay = calculateAvgStudyTimePerDay(totalStudyTimeMinutes, totalStudyDays);
    
    // Get study time breakdown
    const studyTimeBreakdown = getStudyTimeBreakdown(totalStudyTimeMinutes);

    // Get recent study activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = progressRecords.map(progress => {
      const recentSessions = progress.studyCalendar.filter(session => 
        new Date(session.date) >= sevenDaysAgo
      );
      return {
        courseId: progress.courseId._id,
        courseTitle: progress.courseId.title,
        studyMinutes: recentSessions.reduce((sum, session) => sum + session.minutes, 0),
        lessonsCompleted: recentSessions.reduce((sum, session) => sum + session.lessonsCompleted, 0)
      };
    });

    res.json({
      success: true,
      enrolledCourses,
      avgProgress,
      studyTimeMinutes: totalStudyTimeMinutes,
      studyTimeHours: studyTimeBreakdown.totalHours,
      studyTimeFormatted: studyTimeBreakdown.formatted,
      avgStudyTimePerDay: avgStudyTimePerDay,
      completedMaterials,
      completedLessons: completedMaterials, // Alias for compatibility
      currentStreak,
      longestStreak,
      recentActivity,
      totalStudyDays: totalStudyDays,
      studyTimeBreakdown: studyTimeBreakdown
    });
  } catch (error) {
    console.error('Get student overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student overview'
    });
  }
};

// Get detailed progress for a specific course
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;
    
    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId: studentId,
      courseId: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Get progress record
    const progress = await Progress.findOne({
      studentId: studentId,
      courseId: courseId
    }).populate('courseId', 'title modules totalLessons');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    // Get course details
    const course = await Course.findById(courseId).populate('modules');

    res.json({
      success: true,
      progress: {
        course: course,
        lessonsCompleted: progress.lessonsCompleted,
        totalLessons: progress.totalLessons,
        percentage: progress.progressPercentage,
        studyTimeMinutes: progress.totalStudyTime,
        avgStudyTime: progress.avgStudyTime,
        quizzesTaken: progress.quizzesTaken,
        quizzesPassed: progress.quizzesPassed,
        lastAccessed: progress.lastAccessed,
        streak: progress.streak,
        studyCalendar: progress.studyCalendar,
        achievements: progress.achievements
      }
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course progress'
    });
  }
};

// Update progress for a course
const updateCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonsCompleted, studyTimeMinutes, quizResults } = req.body;
    const studentId = req.user.id;
    
    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId: studentId,
      courseId: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Get or create progress record
    let progress = await Progress.findOne({
      studentId: studentId,
      courseId: courseId
    });

    if (!progress) {
      const course = await Course.findById(courseId);
      progress = new Progress({
        studentId: studentId,
        courseId: courseId,
        enrollmentId: enrollment._id,
        totalLessons: course.totalLessons || 0
      });
    }

    // Update progress data
    if (lessonsCompleted !== undefined) {
      progress.lessonsCompleted = Math.max(progress.lessonsCompleted, lessonsCompleted);
    }

    if (studyTimeMinutes !== undefined) {
      progress.totalStudyTime += studyTimeMinutes;
      
      // Add to study calendar
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingEntry = progress.studyCalendar.find(entry => 
        new Date(entry.date).getTime() === today.getTime()
      );
      
      if (existingEntry) {
        existingEntry.minutes += studyTimeMinutes;
        if (lessonsCompleted !== undefined) {
          existingEntry.lessonsCompleted = Math.max(existingEntry.lessonsCompleted, lessonsCompleted);
        }
      } else {
        progress.studyCalendar.push({
          date: today,
          minutes: studyTimeMinutes,
          lessonsCompleted: lessonsCompleted || 0
        });
      }
    }

    if (quizResults) {
      progress.quizzesTaken += 1;
      if (quizResults.passed) {
        progress.quizzesPassed += 1;
      }
    }

    progress.lastAccessed = new Date();
    
    // Update study streak
    await progress.updateStreak();
    
    // Calculate average study time
    if (progress.studyCalendar.length > 0) {
      const totalMinutes = progress.studyCalendar.reduce((sum, entry) => sum + entry.minutes, 0);
      progress.avgStudyTime = Math.round(totalMinutes / progress.studyCalendar.length);
    }

    await progress.save();

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
    console.error('Update course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course progress'
    });
  }
};

// Get study analytics
const getStudyAnalytics = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { timeframe = 'week' } = req.query;
    
    let startDate = new Date();
    if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeframe === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Get all progress records
    const progressRecords = await Progress.find({
      studentId: studentId
    }).populate('courseId', 'title');

    // Filter study calendar entries by timeframe
    const filteredData = progressRecords.map(progress => {
      const filteredCalendar = progress.studyCalendar.filter(entry => 
        new Date(entry.date) >= startDate
      );
      
      return {
        courseId: progress.courseId._id,
        courseTitle: progress.courseId.title,
        studyTime: filteredCalendar.map(entry => entry.minutes),
        lessonsCompleted: filteredCalendar.map(entry => entry.lessonsCompleted),
        dates: filteredCalendar.map(entry => entry.date)
      };
    });

    // Aggregate data by date
    const aggregatedData = {};
    progressRecords.forEach(progress => {
      progress.studyCalendar.forEach(entry => {
        if (new Date(entry.date) >= startDate) {
          const dateKey = new Date(entry.date).toISOString().split('T')[0];
          if (!aggregatedData[dateKey]) {
            aggregatedData[dateKey] = {
              studyTime: 0,
              lessonsCompleted: 0,
              quizzesTaken: 0
            };
          }
          aggregatedData[dateKey].studyTime += entry.minutes;
          aggregatedData[dateKey].lessonsCompleted += entry.lessonsCompleted;
        }
      });
    });

    // Convert to arrays for frontend
    const studyTimeData = Object.entries(aggregatedData).map(([date, data]) => data.studyTime);
    const lessonsData = Object.entries(aggregatedData).map(([date, data]) => data.lessonsCompleted);
    const dates = Object.keys(aggregatedData).sort();

    res.json({
      success: true,
      timeframe,
      data: {
        studyTime: studyTimeData,
        lessonsCompleted: lessonsData,
        dates: dates
      },
      courses: filteredData,
      totalStudyTime: studyTimeData.reduce((sum, time) => sum + time, 0),
      totalLessonsCompleted: lessonsData.reduce((sum, lessons) => sum + lessons, 0)
    });
  } catch (error) {
    console.error('Get study analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study analytics'
    });
  }
};

// Get achievements
const getAchievements = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const progressRecords = await Progress.find({
      studentId: studentId
    }).populate('courseId', 'title');

    // Collect all achievements
    const allAchievements = progressRecords.flatMap(progress => 
      progress.achievements.map(achievement => ({
        ...achievement.toObject(),
        courseTitle: progress.courseId.title
      }))
    );

    // Define available achievements
    const availableAchievements = [
      {
        id: 'first_lesson',
        title: 'First Lesson',
        description: 'Completed your first lesson',
        icon: '🎯',
        condition: (progress) => progress.lessonsCompleted >= 1
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Studied for 7 consecutive days',
        icon: '🔥',
        condition: (progress) => progress.streak.current >= 7
      },
      {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Scored 100% on 5 quizzes',
        icon: '🏆',
        condition: (progress) => progress.quizzesPassed >= 5
      },
      {
        id: 'course_completer',
        title: 'Course Completer',
        description: 'Completed your first course',
        icon: '🎓',
        condition: (progress) => progress.progressPercentage >= 100
      },
      {
        id: 'study_marathon',
        title: 'Study Marathon',
        description: 'Studied for 100 hours total',
        icon: '⏰',
        condition: (progress) => progress.totalStudyTime >= 6000 // 100 hours in minutes
      }
    ];

    // Check which achievements are unlocked
    const unlockedAchievements = [];
    const lockedAchievements = [];

    availableAchievements.forEach(achievement => {
      const isUnlocked = progressRecords.some(progress => 
        achievement.condition(progress)
      );
      
      const existingAchievement = allAchievements.find(a => a.type === achievement.id);
      
      if (isUnlocked) {
        unlockedAchievements.push({
          ...achievement,
          unlocked: true,
          unlockedAt: existingAchievement?.unlockedAt || new Date()
        });
      } else {
        lockedAchievements.push({
          ...achievement,
          unlocked: false
        });
      }
    });

    res.json({
      success: true,
      achievements: [...unlockedAchievements, ...lockedAchievements],
      unlockedCount: unlockedAchievements.length,
      totalCount: availableAchievements.length
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements'
    });
  }
};

module.exports = {
  getStudentOverview,
  getCourseProgress,
  updateCourseProgress,
  getStudyAnalytics,
  getAchievements
};
