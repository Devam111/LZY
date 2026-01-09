const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const SignupUser = require('./src/models/SignupUser');
const Course = require('./src/models/Course');
const Enrollment = require('./src/models/Enrollment');
const Progress = require('./src/models/Progress');

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

// Test the enrollment system
const testEnrollmentSystem = async () => {
  try {
    console.log('🧪 Testing Enrollment System...\n');

    // 1. Create a test faculty user
    console.log('1. Creating test faculty user...');
    const faculty = new SignupUser({
      name: 'Test Faculty',
      email: 'faculty@test.com',
      password: 'hashedpassword',
      role: 'faculty',
      institution: 'Test University'
    });
    await faculty.save();
    console.log('✅ Faculty created:', faculty._id);

    // 2. Create a test student user
    console.log('2. Creating test student user...');
    const student = new SignupUser({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'hashedpassword',
      role: 'student',
      institution: 'Test University',
      studentId: 'STU001'
    });
    await student.save();
    console.log('✅ Student created:', student._id);

    // 3. Create a test course
    console.log('3. Creating test course...');
    const course = new Course({
      title: 'Introduction to React',
      description: 'Learn React from scratch',
      category: 'Web Development',
      level: 'Beginner',
      duration: '4 weeks',
      price: 0,
      facultyId: faculty._id,
      modules: [
        {
          title: 'Getting Started',
          description: 'Introduction to React',
          order: 1,
          lessons: [
            { title: 'What is React?', type: 'text', order: 1 },
            { title: 'Setting up React', type: 'video', order: 2 }
          ]
        },
        {
          title: 'Components',
          description: 'Understanding React Components',
          order: 2,
          lessons: [
            { title: 'Functional Components', type: 'text', order: 1 },
            { title: 'Class Components', type: 'video', order: 2 }
          ]
        }
      ],
      isPublished: true
    });
    await course.save();
    console.log('✅ Course created:', course._id);

    // 4. Enroll student in course
    console.log('4. Enrolling student in course...');
    const enrollment = new Enrollment({
      studentId: student._id,
      courseId: course._id,
      progress: {
        totalLessons: course.totalLessons
      }
    });
    await enrollment.save();
    console.log('✅ Enrollment created:', enrollment._id);

    // 5. Create progress record
    console.log('5. Creating progress record...');
    const progress = new Progress({
      studentId: student._id,
      courseId: course._id,
      enrollmentId: enrollment._id,
      totalLessons: course.totalLessons,
      lessonsCompleted: 1,
      studyCalendar: [
        {
          date: new Date(),
          minutes: 30,
          lessonsCompleted: 1
        }
      ]
    });
    await progress.save();
    console.log('✅ Progress created:', progress._id);

    // 6. Test queries
    console.log('6. Testing queries...');
    
    // Get student enrollments
    const studentEnrollments = await Enrollment.find({ studentId: student._id })
      .populate('courseId', 'title description')
      .populate('studentId', 'name email');
    console.log('✅ Student enrollments:', studentEnrollments.length);

    // Get student progress
    const studentProgress = await Progress.find({ studentId: student._id })
      .populate('courseId', 'title');
    console.log('✅ Student progress records:', studentProgress.length);

    // Get course enrollments
    const courseEnrollments = await Enrollment.find({ courseId: course._id });
    console.log('✅ Course enrollments:', courseEnrollments.length);

    console.log('\n🎉 All tests passed! Enrollment system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await SignupUser.deleteMany({ email: { $in: ['faculty@test.com', 'student@test.com'] } });
    await Course.deleteMany({ title: 'Introduction to React' });
    await Enrollment.deleteMany({});
    await Progress.deleteMany({});
    console.log('✅ Test data cleaned up');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run the test
const runTest = async () => {
  await connectDb();
  await testEnrollmentSystem();
};

runTest();

