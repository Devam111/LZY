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

// Test the complete student course flow
const testStudentCourseFlow = async () => {
  try {
    console.log('🧪 Testing Complete Student Course Flow...\n');

    // 1. Get a student user
    console.log('1. Getting student user...');
    const student = await SignupUser.findOne({ role: 'student' });
    if (!student) {
      console.log('❌ No student found. Creating one...');
      const newStudent = new SignupUser({
        name: 'Test Student',
        email: 'teststudent@test.com',
        password: 'hashedpassword',
        role: 'student',
        institution: 'Test University',
        studentId: 'TEST001'
      });
      await newStudent.save();
      student = newStudent;
    }
    console.log('✅ Student:', student.name, student.email);

    // 2. Check published courses
    console.log('\n2. Checking published courses...');
    const publishedCourses = await Course.find({ isPublished: true }).populate('facultyId', 'name email');
    console.log(`✅ Found ${publishedCourses.length} published courses:`);
    publishedCourses.forEach(course => {
      console.log(`   - ${course.title} (Faculty: ${course.facultyId?.name || 'Unknown'})`);
    });

    if (publishedCourses.length === 0) {
      console.log('❌ No published courses found. Creating test courses...');
      
      // Get faculty
      const faculty = await SignupUser.findOne({ role: 'faculty' });
      if (!faculty) {
        console.log('❌ No faculty found. Cannot create courses.');
        return;
      }

      // Create test courses
      const testCourses = [
        {
          title: 'JavaScript Fundamentals',
          description: 'Learn JavaScript from scratch',
          category: 'Programming',
          level: 'Beginner',
          duration: '4 weeks',
          price: 0,
          facultyId: faculty._id,
          modules: [
            {
              title: 'Basics',
              description: 'JavaScript basics',
              order: 1,
              lessons: [
                { title: 'Variables', type: 'text', order: 1 },
                { title: 'Functions', type: 'video', order: 2 }
              ]
            }
          ],
          isPublished: true
        }
      ];

      for (const courseData of testCourses) {
        const course = new Course(courseData);
        await course.save();
        console.log(`✅ Created course: ${course.title}`);
      }
    }

    // 3. Simulate student browsing courses (what the API should return)
    console.log('\n3. Simulating student course browsing...');
    const studentCourses = await Course.find({ isPublished: true })
      .populate('facultyId', 'name email')
      .sort({ createdAt: -1 });

    // Check enrollment status
    const enrollments = await Enrollment.find({ 
      studentId: student._id, 
      status: 'active' 
    }).select('courseId');
    
    const enrolledCourseIds = enrollments.map(e => e.courseId.toString());
    
    const coursesWithEnrollment = studentCourses.map(course => ({
      ...course.toObject(),
      isEnrolled: enrolledCourseIds.includes(course._id.toString())
    }));

    console.log(`✅ Student can see ${coursesWithEnrollment.length} courses:`);
    coursesWithEnrollment.forEach(course => {
      console.log(`   - ${course.title} (Enrolled: ${course.isEnrolled})`);
    });

    // 4. Test enrollment
    if (coursesWithEnrollment.length > 0 && !coursesWithEnrollment[0].isEnrolled) {
      console.log('\n4. Testing course enrollment...');
      const courseToEnroll = coursesWithEnrollment[0];
      
      // Create enrollment
      const enrollment = new Enrollment({
        studentId: student._id,
        courseId: courseToEnroll._id,
        progress: {
          totalLessons: courseToEnroll.totalLessons
        }
      });
      await enrollment.save();
      console.log(`✅ Enrolled in course: ${courseToEnroll.title}`);

      // Create progress record
      const progress = new Progress({
        studentId: student._id,
        courseId: courseToEnroll._id,
        enrollmentId: enrollment._id,
        totalLessons: courseToEnroll.totalLessons || 0
      });
      await progress.save();
      console.log('✅ Progress record created');

      // 5. Test dashboard stats
      console.log('\n5. Testing dashboard stats...');
      const studentEnrollments = await Enrollment.find({ 
        studentId: student._id, 
        status: 'active' 
      }).populate('courseId', 'title');

      const progressRecords = await Progress.find({ studentId: student._id });
      
      const stats = {
        enrolledCourses: studentEnrollments.length,
        avgProgress: progressRecords.length > 0 
          ? Math.round(progressRecords.reduce((sum, p) => sum + p.progressPercentage, 0) / progressRecords.length)
          : 0,
        studyTimeMinutes: progressRecords.reduce((sum, p) => sum + (p.totalStudyTime || 0), 0),
        completedMaterials: progressRecords.reduce((sum, p) => sum + (p.lessonsCompleted || 0), 0)
      };

      console.log('✅ Dashboard stats:');
      console.log(`   - Enrolled courses: ${stats.enrolledCourses}`);
      console.log(`   - Average progress: ${stats.avgProgress}%`);
      console.log(`   - Study time: ${stats.studyTimeMinutes} minutes`);
      console.log(`   - Completed materials: ${stats.completedMaterials}`);
    }

    console.log('\n🎉 Complete student course flow test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run the test
const runTest = async () => {
  await connectDb();
  await testStudentCourseFlow();
};

runTest();
