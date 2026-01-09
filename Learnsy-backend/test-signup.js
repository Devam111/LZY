const mongoose = require('mongoose');
const SignupUser = require('./src/models/SignupUser');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/learnsy');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test signup functionality
const testSignup = async () => {
  try {
    await connectDB();
    
    // Clear existing test data
    await SignupUser.deleteMany({ email: { $regex: /test@/ } });
    console.log('🧹 Cleared existing test data');
    
    // Test Student Registration
    console.log('\n📝 Testing Student Registration...');
    const studentData = {
      name: 'Test Student',
      email: 'test.student@university.edu',
      password: 'TestPassword123',
      studentId: 'STU001',
      department: 'Computer Science',
      role: 'student'
    };
    
    const student = await SignupUser.create(studentData);
    console.log('✅ Student created:', {
      id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      studentId: student.studentId
    });
    
    // Test Faculty Registration
    console.log('\n📝 Testing Faculty Registration...');
    const facultyData = {
      name: 'Dr. Test Faculty',
      email: 'test.faculty@university.edu',
      password: 'TestPassword123',
      institution: 'Test University',
      department: 'Computer Science',
      role: 'faculty'
    };
    
    const faculty = await SignupUser.create(facultyData);
    console.log('✅ Faculty created:', {
      id: faculty._id,
      name: faculty.name,
      email: faculty.email,
      role: faculty.role,
      institution: faculty.institution
    });
    
    // Test Password Comparison
    console.log('\n🔐 Testing Password Comparison...');
    const isStudentPasswordValid = await student.comparePassword('TestPassword123');
    const isFacultyPasswordValid = await faculty.comparePassword('TestPassword123');
    console.log('✅ Student password valid:', isStudentPasswordValid);
    console.log('✅ Faculty password valid:', isFacultyPasswordValid);
    
    // Test Safe Object Method
    console.log('\n🔒 Testing Safe Object Method...');
    const studentSafe = student.toSafeObject();
    const facultySafe = faculty.toSafeObject();
    console.log('✅ Student safe object (no password):', !studentSafe.password);
    console.log('✅ Faculty safe object (no password):', !facultySafe.password);
    
    // Test Static Methods
    console.log('\n🔍 Testing Static Methods...');
    const foundStudent = await SignupUser.findByEmail('test.student@university.edu');
    const foundFaculty = await SignupUser.findByEmail('test.faculty@university.edu');
    console.log('✅ Found student by email:', foundStudent ? 'Yes' : 'No');
    console.log('✅ Found faculty by email:', foundFaculty ? 'Yes' : 'No');
    
    const foundByStudentId = await SignupUser.findByStudentId('STU001');
    console.log('✅ Found student by ID:', foundByStudentId ? 'Yes' : 'No');
    
    // Test Statistics
    console.log('\n📊 Testing Statistics...');
    const stats = await SignupUser.getSignupStats();
    console.log('✅ Signup statistics:', stats);
    
    // Test Validation Errors
    console.log('\n❌ Testing Validation Errors...');
    try {
      await SignupUser.create({
        name: 'A', // Too short
        email: 'invalid-email', // Invalid email
        password: '123', // Too short
        role: 'invalid-role' // Invalid role
      });
    } catch (error) {
      console.log('✅ Validation errors caught:', error.name === 'ValidationError');
    }
    
    // Test Duplicate Email
    try {
      await SignupUser.create({
        name: 'Another Student',
        email: 'test.student@university.edu', // Duplicate email
        password: 'TestPassword123',
        studentId: 'STU002',
        role: 'student'
      });
    } catch (error) {
      console.log('✅ Duplicate email error caught:', error.code === 11000);
    }
    
    // Test Duplicate Student ID
    try {
      await SignupUser.create({
        name: 'Another Student',
        email: 'another.student@university.edu',
        password: 'TestPassword123',
        studentId: 'STU001', // Duplicate student ID
        role: 'student'
      });
    } catch (error) {
      console.log('✅ Duplicate student ID error caught:', error.message.includes('Student ID already exists'));
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Students in database: ${await SignupUser.countDocuments({ role: 'student' })}`);
    console.log(`   - Faculty in database: ${await SignupUser.countDocuments({ role: 'faculty' })}`);
    console.log(`   - Total users: ${await SignupUser.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
testSignup();
