const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const SignupUser = require('./src/models/SignupUser');
const Course = require('./src/models/Course');
const Enrollment = require('./src/models/Enrollment');
const Progress = require('./src/models/Progress');
const StudySession = require('./src/models/StudySession');

// Connect to MongoDB
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnsy');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test the live tracking system
const testLiveTracking = async () => {
  try {
    console.log('🧪 Testing Live Tracking System...\n');

    // 1. Create a test student
    console.log('1. Creating test student...');
    const student = new SignupUser({
      name: 'Live Test Student',
      email: `livetest${Date.now()}@test.com`,
      password: 'hashedpassword',
      role: 'student',
      institution: 'Test University',
      studentId: `LIVE${Date.now()}`
    });
    await student.save();
    console.log('✅ Student created:', student._id);

    // 2. Create a test course
    console.log('2. Creating test course...');
    const course = new Course({
      title: 'Live Tracking Test Course',
      description: 'Test course for live tracking',
      category: 'Testing',
      level: 'Beginner',
      duration: '1 week',
      price: 0,
      facultyId: student._id, // Using student as faculty for simplicity
      modules: [
        {
          title: 'Test Module',
          description: 'Test module for tracking',
          order: 1,
          lessons: [
            { title: 'Test Lesson 1', type: 'text', order: 1 },
            { title: 'Test Lesson 2', type: 'video', order: 2 }
          ]
        }
      ],
      isPublished: true
    });
    await course.save();
    console.log('✅ Course created:', course._id);

    // 3. Enroll student in course
    console.log('3. Enrolling student in course...');
    const enrollment = new Enrollment({
      studentId: student._id,
      courseId: course._id,
      progress: {
        totalLessons: course.totalLessons
      }
    });
    await enrollment.save();
    console.log('✅ Enrollment created:', enrollment._id);

    // 4. Create progress record
    console.log('4. Creating progress record...');
    const progress = new Progress({
      studentId: student._id,
      courseId: course._id,
      enrollmentId: enrollment._id,
      totalLessons: course.totalLessons,
      lessonsCompleted: 0
    });
    await progress.save();
    console.log('✅ Progress created:', progress._id);

    // 5. Start a study session
    console.log('5. Starting study session...');
    const session = new StudySession({
      studentId: student._id,
      courseId: course._id,
      enrollmentId: enrollment._id,
      startTime: new Date(),
      activity: 'reading',
      deviceInfo: {
        userAgent: 'Test Browser',
        screenResolution: '1920x1080',
        browser: 'Test Browser'
      }
    });
    await session.save();
    console.log('✅ Study session started:', session._id);

    // 6. Simulate study activity
    console.log('6. Simulating study activity...');
    await session.updateActivity('watching', { lessonCompleted: true });
    console.log('✅ Activity updated');

    // 7. End study session
    console.log('7. Ending study session...');
    await session.endSession();
    console.log('✅ Study session ended');

    // 8. Test live stats calculation
    console.log('8. Testing live stats...');
    const todaySessions = await StudySession.getDailyStudyTime(student._id, new Date());
    const totalTime = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    console.log('✅ Today\'s study time:', totalTime, 'minutes');

    // 9. Test streak calculation
    console.log('9. Testing streak calculation...');
    await progress.updateStreak();
    console.log('✅ Current streak:', progress.streak.current);

    console.log('\n🎉 All live tracking tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await SignupUser.deleteMany({ email: { $regex: /livetest.*@test\.com/ } });
    await Course.deleteMany({ title: 'Live Tracking Test Course' });
    await Enrollment.deleteMany({});
    await Progress.deleteMany({});
    await StudySession.deleteMany({});
    console.log('✅ Test data cleaned up');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run the test
const runTest = async () => {
  await connectDb();
  await testLiveTracking();
};

runTest();

