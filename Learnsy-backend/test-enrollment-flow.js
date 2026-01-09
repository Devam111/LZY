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

// Test the complete enrollment flow
const testEnrollmentFlow = async () => {
  try {
    console.log('🧪 Testing Complete Enrollment Flow...\n');

    // 1. Create a test faculty
    console.log('1. Creating test faculty...');
    const faculty = new SignupUser({
      name: 'Test Faculty',
      email: `faculty${Date.now()}@test.com`,
      password: 'hashedpassword',
      role: 'faculty',
      institution: 'Test University'
    });
    await faculty.save();
    console.log('✅ Faculty created:', faculty._id);

    // 2. Create a test student
    console.log('2. Creating test student...');
    const student = new SignupUser({
      name: 'Test Student',
      email: `student${Date.now()}@test.com`,
      password: 'hashedpassword',
      role: 'student',
      institution: 'Test University',
      studentId: `STU${Date.now()}`
    });
    await student.save();
    console.log('✅ Student created:', student._id);

    // 3. Create a published course
    console.log('3. Creating published course...');
    const course = new Course({
      title: 'Complete Course Test',
      description: 'A comprehensive test course',
      category: 'Testing',
      level: 'Beginner',
      duration: '2 weeks',
      price: 0,
      facultyId: faculty._id,
      modules: [
        {
          title: 'Module 1',
          description: 'First module',
          order: 1,
          lessons: [
            { title: 'Lesson 1', type: 'text', order: 1 },
            { title: 'Lesson 2', type: 'video', order: 2 }
          ]
        },
        {
          title: 'Module 2',
          description: 'Second module',
          order: 2,
          lessons: [
            { title: 'Lesson 3', type: 'text', order: 1 },
            { title: 'Lesson 4', type: 'quiz', order: 2 }
          ]
        }
      ],
      isPublished: true
    });
    await course.save();
    console.log('✅ Course created:', course._id);

    // 4. Test course filtering (should show published courses)
    console.log('4. Testing course filtering...');
    const publishedCourses = await Course.find({ isPublished: true });
    console.log('✅ Published courses found:', publishedCourses.length);

    // 5. Test enrollment
    console.log('5. Testing enrollment...');
    const enrollment = new Enrollment({
      studentId: student._id,
      courseId: course._id,
      progress: {
        totalLessons: course.totalLessons
      }
    });
    await enrollment.save();
    console.log('✅ Enrollment created:', enrollment._id);

    // 6. Test progress creation
    console.log('6. Testing progress creation...');
    const progress = new Progress({
      studentId: student._id,
      courseId: course._id,
      enrollmentId: enrollment._id,
      totalLessons: course.totalLessons,
      lessonsCompleted: 0
    });
    await progress.save();
    console.log('✅ Progress created:', progress._id);

    // 7. Test enrollment status check
    console.log('7. Testing enrollment status check...');
    const studentEnrollments = await Enrollment.find({ 
      studentId: student._id, 
      status: 'active' 
    }).populate('courseId', 'title');
    console.log('✅ Student enrollments:', studentEnrollments.length);

    // 8. Test course enrollment count
    console.log('8. Testing course enrollment count...');
    const courseEnrollments = await Enrollment.find({ 
      courseId: course._id, 
      status: 'active' 
    });
    console.log('✅ Course enrollments:', courseEnrollments.length);

    // 9. Test progress update
    console.log('9. Testing progress update...');
    progress.lessonsCompleted = 2;
    progress.totalStudyTime = 60; // 1 hour
    await progress.save();
    console.log('✅ Progress updated');

    // 10. Test dashboard stats calculation
    console.log('10. Testing dashboard stats...');
    const allProgress = await Progress.find({ studentId: student._id });
    const totalStudyTime = allProgress.reduce((sum, p) => sum + (p.totalStudyTime || 0), 0);
    const totalLessons = allProgress.reduce((sum, p) => sum + (p.lessonsCompleted || 0), 0);
    const avgProgress = allProgress.length > 0 
      ? Math.round(allProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / allProgress.length)
      : 0;
    
    console.log('✅ Dashboard stats calculated:');
    console.log('   - Enrolled courses:', studentEnrollments.length);
    console.log('   - Average progress:', avgProgress + '%');
    console.log('   - Study time:', totalStudyTime + ' minutes');
    console.log('   - Completed lessons:', totalLessons);

    console.log('\n🎉 Complete enrollment flow test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await SignupUser.deleteMany({ 
      email: { $regex: /(faculty|student).*@test\.com/ } 
    });
    await Course.deleteMany({ title: 'Complete Course Test' });
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
  await testEnrollmentFlow();
};

runTest();

