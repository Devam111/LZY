const StudySession = require('../models/StudySession');
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// Start a new study session
const startStudySession = async (req, res) => {
  try {
    const { courseId, activity = 'browsing', deviceInfo } = req.body;
    const studentId = req.user.id;

    // Check if there's already an active session
    const existingSession = await StudySession.findOne({
      studentId,
      isActive: true
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active study session'
      });
    }

    // Get enrollment if courseId is provided
    let enrollment = null;
    if (courseId) {
      enrollment = await Enrollment.findOne({
        studentId,
        courseId,
        status: 'active'
      });
    }

    // Create new study session
    const session = new StudySession({
      studentId,
      courseId: courseId || null,
      enrollmentId: enrollment?._id || null,
      startTime: new Date(),
      activity,
      deviceInfo: deviceInfo || {}
    });

    await session.save();

    res.json({
      success: true,
      session: {
        id: session._id,
        startTime: session.startTime,
        activity: session.activity,
        courseId: session.courseId
      },
      message: 'Study session started'
    });
  } catch (error) {
    console.error('Start study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting study session'
    });
  }
};

// Update study session activity
const updateStudySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { activity, additionalData } = req.body;
    const studentId = req.user.id;

    const session = await StudySession.findOne({
      _id: sessionId,
      studentId,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active study session not found'
      });
    }

    // Update session activity
    await session.updateActivity(activity, additionalData);

    res.json({
      success: true,
      session: {
        id: session._id,
        activity: session.activity,
        lastActivityTime: session.lastActivityTime,
        lessonsCompleted: session.lessonsCompleted,
        currentDuration: session.currentDuration
      },
      message: 'Study session updated'
    });
  } catch (error) {
    console.error('Update study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating study session'
    });
  }
};

// End study session
const endStudySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const studentId = req.user.id;

    const session = await StudySession.findOne({
      _id: sessionId,
      studentId,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active study session not found'
      });
    }

    // End the session
    await session.endSession();

    // Update progress if session had a course
    if (session.courseId && session.duration > 0) {
      await updateProgressFromSession(session);
    }

    res.json({
      success: true,
      session: {
        id: session._id,
        duration: session.duration,
        totalActiveTime: session.totalActiveTime,
        lessonsCompleted: session.lessonsCompleted,
        focusPercentage: session.getFocusPercentage()
      },
      message: 'Study session ended'
    });
  } catch (error) {
    console.error('End study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending study session'
    });
  }
};

// Get active study session
const getActiveStudySession = async (req, res) => {
  try {
    const studentId = req.user.id;

    const session = await StudySession.findOne({
      studentId,
      isActive: true
    }).populate('courseId', 'title');

    if (!session) {
      return res.json({
        success: true,
        session: null,
        message: 'No active study session'
      });
    }

    res.json({
      success: true,
      session: {
        id: session._id,
        startTime: session.startTime,
        currentDuration: session.currentDuration,
        activity: session.activity,
        course: session.courseId,
        lessonsCompleted: session.lessonsCompleted,
        lastActivityTime: session.lastActivityTime
      }
    });
  } catch (error) {
    console.error('Get active study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active study session'
    });
  }
};

// Get study session history
const getStudySessionHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { limit = 10, page = 1, courseId } = req.query;

    const query = { studentId, isActive: false };
    if (courseId) {
      query.courseId = courseId;
    }

    const sessions = await StudySession.find(query)
      .populate('courseId', 'title')
      .sort({ endTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudySession.countDocuments(query);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        activity: session.activity,
        course: session.courseId,
        lessonsCompleted: session.lessonsCompleted,
        focusPercentage: session.getFocusPercentage()
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get study session history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study session history'
    });
  }
};

// Get live study statistics
const getLiveStudyStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get active session
    const activeSession = await StudySession.findOne({
      studentId,
      isActive: true
    }).populate('courseId', 'title');

    // Get today's sessions
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todaySessions = await StudySession.find({
      studentId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    // Calculate today's stats
    const todayStats = {
      totalTime: todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0),
      activeTime: todaySessions.reduce((sum, session) => sum + (session.totalActiveTime || 0), 0),
      sessionsCount: todaySessions.length,
      lessonsCompleted: todaySessions.reduce((sum, session) => sum + (session.lessonsCompleted || 0), 0)
    };

    // Add current session if active
    if (activeSession) {
      todayStats.totalTime += activeSession.currentDuration;
      todayStats.sessionsCount += 1;
      todayStats.lessonsCompleted += activeSession.lessonsCompleted;
    }

    // Get weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklySessions = await StudySession.find({
      studentId,
      startTime: { $gte: weekAgo }
    });

    const weeklyStats = {
      totalTime: weeklySessions.reduce((sum, session) => sum + (session.duration || 0), 0),
      sessionsCount: weeklySessions.length,
      lessonsCompleted: weeklySessions.reduce((sum, session) => sum + (session.lessonsCompleted || 0), 0),
      averageSessionTime: weeklySessions.length > 0 
        ? Math.round(weeklySessions.reduce((sum, session) => sum + (session.duration || 0), 0) / weeklySessions.length)
        : 0
    };

    // Calculate current streak
    const streak = await calculateCurrentStreak(studentId);

    res.json({
      success: true,
      activeSession: activeSession ? {
        id: activeSession._id,
        startTime: activeSession.startTime,
        currentDuration: activeSession.currentDuration,
        activity: activeSession.activity,
        course: activeSession.courseId
      } : null,
      todayStats,
      weeklyStats,
      currentStreak: streak.current,
      longestStreak: streak.longest
    });
  } catch (error) {
    console.error('Get live study stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live study statistics'
    });
  }
};

// Helper function to update progress from session
const updateProgressFromSession = async (session) => {
  try {
    if (!session.courseId) return;

    // Find or create progress record
    let progress = await Progress.findOne({
      studentId: session.studentId,
      courseId: session.courseId
    });

    if (!progress) {
      const course = await Course.findById(session.courseId);
      progress = new Progress({
        studentId: session.studentId,
        courseId: session.courseId,
        enrollmentId: session.enrollmentId,
        totalLessons: course?.totalLessons || 0
      });
    }

    // Update progress with session data
    progress.totalStudyTime += session.totalActiveTime || session.duration;
    progress.lessonsCompleted += session.lessonsCompleted || 0;
    progress.lastAccessed = new Date();

    // Add to study calendar
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingEntry = progress.studyCalendar.find(entry => 
      new Date(entry.date).getTime() === today.getTime()
    );

    if (existingEntry) {
      existingEntry.minutes += session.totalActiveTime || session.duration;
      existingEntry.lessonsCompleted += session.lessonsCompleted || 0;
    } else {
      progress.studyCalendar.push({
        date: today,
        minutes: session.totalActiveTime || session.duration,
        lessonsCompleted: session.lessonsCompleted || 0
      });
    }

    // Update study streak
    await progress.updateStreak();

    // Calculate average study time
    if (progress.studyCalendar.length > 0) {
      const totalMinutes = progress.studyCalendar.reduce((sum, entry) => sum + entry.minutes, 0);
      progress.avgStudyTime = Math.round(totalMinutes / progress.studyCalendar.length);
    }

    await progress.save();

    // Update enrollment progress
    if (session.enrollmentId) {
      const enrollment = await Enrollment.findById(session.enrollmentId);
      if (enrollment) {
        enrollment.progress.lessonsCompleted = progress.lessonsCompleted;
        enrollment.progress.percentage = progress.progressPercentage;
        enrollment.progress.lastAccessed = new Date();
        await enrollment.save();
      }
    }
  } catch (error) {
    console.error('Error updating progress from session:', error);
  }
};

// Helper function to calculate current streak
const calculateCurrentStreak = async (studentId) => {
  try {
    const progressRecords = await Progress.find({ studentId });
    
    if (progressRecords.length === 0) {
      return { current: 0, longest: 0 };
    }

    const currentStreak = Math.max(...progressRecords.map(p => p.streak.current));
    const longestStreak = Math.max(...progressRecords.map(p => p.streak.longest));

    return { current: currentStreak, longest: longestStreak };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return { current: 0, longest: 0 };
  }
};

module.exports = {
  startStudySession,
  updateStudySession,
  endStudySession,
  getActiveStudySession,
  getStudySessionHistory,
  getLiveStudyStats
};