const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config();

// Import models
const SignupUser = require('./src/models/SignupUser');
const Course = require('./src/models/Course');
const Material = require('./src/models/Material');
const Progress = require('./src/models/Progress');
const StudySession = require('./src/models/StudySession');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnsy');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create sample data
const createSampleData = async () => {
  try {
    console.log('🔄 Creating sample data...');

    // Clear existing data
    await SignupUser.deleteMany({});
    await Course.deleteMany({});
    await Material.deleteMany({});
    await Progress.deleteMany({});
    await StudySession.deleteMany({});

    // Create sample faculty
    const faculty = new SignupUser({
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      password: 'faculty123', // Let the model hash it
      role: 'faculty',
      institution: 'University of Technology',
      department: 'Computer Science',
      phone: '+1-555-0123',
      isEmailVerified: true,
      profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    });
    await faculty.save();
    console.log('✅ Created faculty:', faculty.name);

    // Create sample students
    const students = [
      {
        name: 'John Smith',
        email: 'john.smith@student.edu',
        password: 'student123', // Let the model hash it
        role: 'student',
        institution: 'University of Technology',
        studentId: 'STU001',
        major: 'Computer Science',
        phone: '+1-555-0124',
        isEmailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@student.edu',
        password: 'student123', // Let the model hash it
        role: 'student',
        institution: 'University of Technology',
        studentId: 'STU002',
        major: 'Computer Science',
        phone: '+1-555-0125',
        isEmailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@student.edu',
        password: 'student123', // Let the model hash it
        role: 'student',
        institution: 'University of Technology',
        studentId: 'STU003',
        major: 'Computer Science',
        phone: '+1-555-0126',
        isEmailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      }
    ];

    const createdStudents = [];
    for (const studentData of students) {
      const student = new SignupUser(studentData);
      await student.save();
      createdStudents.push(student);
      console.log('✅ Created student:', student.name);
    }

    // Create sample courses
    const courses = [
      {
        title: 'Introduction to Web Development',
        description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
        facultyId: faculty._id,
        category: 'Web Development',
        level: 'Beginner',
        duration: '12 weeks',
        price: 99.99,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
        tags: ['HTML', 'CSS', 'JavaScript', 'Web Development'],
        prerequisites: [],
        learningObjectives: [
          'Understand HTML structure and semantics',
          'Style web pages with CSS',
          'Add interactivity with JavaScript',
          'Build responsive web applications'
        ]
      },
      {
        title: 'Advanced React Development',
        description: 'Master React.js with hooks, context, and advanced patterns for building modern web applications.',
        facultyId: faculty._id,
        category: 'Frontend Development',
        level: 'Intermediate',
        duration: '8 weeks',
        price: 149.99,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
        tags: ['React', 'JavaScript', 'Frontend', 'Hooks'],
        prerequisites: ['Basic JavaScript knowledge'],
        learningObjectives: [
          'Master React hooks and context',
          'Build complex state management',
          'Implement routing and navigation',
          'Deploy React applications'
        ]
      },
      {
        title: 'Node.js Backend Development',
        description: 'Build robust backend applications with Node.js, Express, and MongoDB.',
        facultyId: faculty._id,
        category: 'Backend Development',
        level: 'Intermediate',
        duration: '10 weeks',
        price: 179.99,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
        tags: ['Node.js', 'Express', 'MongoDB', 'Backend'],
        prerequisites: ['Basic JavaScript knowledge'],
        learningObjectives: [
          'Build RESTful APIs with Express',
          'Work with MongoDB databases',
          'Implement authentication and authorization',
          'Deploy backend applications'
        ]
      },
      {
        title: 'Data Structures and Algorithms',
        description: 'Master fundamental data structures and algorithms for technical interviews.',
        facultyId: faculty._id,
        category: 'Computer Science',
        level: 'Advanced',
        duration: '16 weeks',
        price: 199.99,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
        tags: ['Algorithms', 'Data Structures', 'Programming', 'Interview Prep'],
        prerequisites: ['Strong programming fundamentals'],
        learningObjectives: [
          'Master common data structures',
          'Implement efficient algorithms',
          'Solve complex programming problems',
          'Prepare for technical interviews'
        ]
      }
    ];

    const createdCourses = [];
    for (const courseData of courses) {
      const course = new Course(courseData);
      await course.save();
      createdCourses.push(course);
      console.log('✅ Created course:', course.title);
    }

    // Create sample materials for each course
    const materials = [
      // Web Development Course Materials
      {
        courseId: createdCourses[0]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example1',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[0]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example2',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[0]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example3',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[0]._id,
        type: 'doc',
        fileURL: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
        uploadedBy: faculty._id
      },
      // React Course Materials
      {
        courseId: createdCourses[1]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example4',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[1]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example5',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[1]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example6',
        uploadedBy: faculty._id
      },
      // Node.js Course Materials
      {
        courseId: createdCourses[2]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example7',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[2]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example8',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[2]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example9',
        uploadedBy: faculty._id
      },
      // Data Structures Course Materials
      {
        courseId: createdCourses[3]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example10',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[3]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example11',
        uploadedBy: faculty._id
      },
      {
        courseId: createdCourses[3]._id,
        type: 'video',
        fileURL: 'https://www.youtube.com/watch?v=example12',
        uploadedBy: faculty._id
      }
    ];

    const createdMaterials = [];
    for (const materialData of materials) {
      const material = new Material(materialData);
      await material.save();
      createdMaterials.push(material);
      console.log('✅ Created material for course:', material.courseId);
    }

    // Enroll students in courses
    const enrollments = [
      { student: createdStudents[0], course: createdCourses[0] }, // John in Web Dev
      { student: createdStudents[0], course: createdCourses[1] }, // John in React
      { student: createdStudents[1], course: createdCourses[0] }, // Emily in Web Dev
      { student: createdStudents[1], course: createdCourses[2] }, // Emily in Node.js
      { student: createdStudents[2], course: createdCourses[1] }, // Michael in React
      { student: createdStudents[2], course: createdCourses[3] }, // Michael in Data Structures
    ];

    for (const enrollment of enrollments) {
      await SignupUser.findByIdAndUpdate(
        enrollment.student._id,
        { $addToSet: { enrolledCourses: enrollment.course._id } }
      );
      console.log(`✅ Enrolled ${enrollment.student.name} in ${enrollment.course.title}`);
    }

    // Create sample progress records
    const progressRecords = [
      {
        studentId: createdStudents[0]._id,
        courseId: createdCourses[0]._id,
        lessonsCompleted: 2,
        totalLessons: 4,
        avgStudyTime: 45,
        lastAccessed: new Date()
      },
      {
        studentId: createdStudents[0]._id,
        courseId: createdCourses[1]._id,
        lessonsCompleted: 1,
        totalLessons: 3,
        avgStudyTime: 50,
        lastAccessed: new Date()
      },
      {
        studentId: createdStudents[1]._id,
        courseId: createdCourses[0]._id,
        lessonsCompleted: 3,
        totalLessons: 4,
        avgStudyTime: 40,
        lastAccessed: new Date()
      },
      {
        studentId: createdStudents[1]._id,
        courseId: createdCourses[2]._id,
        lessonsCompleted: 1,
        totalLessons: 3,
        avgStudyTime: 55,
        lastAccessed: new Date()
      },
      {
        studentId: createdStudents[2]._id,
        courseId: createdCourses[1]._id,
        lessonsCompleted: 2,
        totalLessons: 3,
        avgStudyTime: 65,
        lastAccessed: new Date()
      },
      {
        studentId: createdStudents[2]._id,
        courseId: createdCourses[3]._id,
        lessonsCompleted: 1,
        totalLessons: 3,
        avgStudyTime: 90,
        lastAccessed: new Date()
      }
    ];

    for (const progressData of progressRecords) {
      const progress = new Progress(progressData);
      await progress.save();
      console.log(`✅ Created progress record for ${progressData.studentId} in course ${progressData.courseId}`);
    }

    // Create sample study sessions
    const studySessions = [
      {
        studentId: createdStudents[0]._id,
        courseId: createdCourses[0]._id,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        duration: 30, // 30 minutes
        activity: 'watching'
      },
      {
        studentId: createdStudents[1]._id,
        courseId: createdCourses[0]._id,
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        endTime: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
        duration: 30,
        activity: 'reading'
      },
      {
        studentId: createdStudents[2]._id,
        courseId: createdCourses[1]._id,
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        duration: 60,
        activity: 'watching'
      }
    ];

    for (const sessionData of studySessions) {
      const session = new StudySession(sessionData);
      await session.save();
      console.log(`✅ Created study session for ${sessionData.studentId}`);
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Faculty: 1 (${faculty.name})`);
    console.log(`- Students: ${createdStudents.length}`);
    console.log(`- Courses: ${createdCourses.length}`);
    console.log(`- Materials: ${materials.length}`);
    console.log(`- Enrollments: ${enrollments.length}`);
    console.log(`- Progress Records: ${progressRecords.length}`);
    console.log(`- Study Sessions: ${studySessions.length}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Faculty: sarah.johnson@university.edu / faculty123');
    console.log('Student: john.smith@student.edu / student123');
    console.log('Student: emily.davis@student.edu / student123');
    console.log('Student: michael.brown@student.edu / student123');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createSampleData();
  process.exit(0);
};

main();
