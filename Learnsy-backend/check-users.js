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

// Check users in database
const checkUsers = async () => {
  try {
    await connectDB();
    
    const users = await SignupUser.find({}).select('-password'); // Exclude password for security
    console.log('\n📊 Users in Database:');
    console.log('====================');
    
    if (users.length === 0) {
      console.log('No users found in database.');
      console.log('💡 Try registering a new user through the frontend!');
    } else {
      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Student ID: ${user.studentId || 'N/A'}`);
        console.log(`   Institution: ${user.institution || 'N/A'}`);
        console.log(`   Department: ${user.department || 'N/A'}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    }
    
    console.log(`\n📈 Total Users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

checkUsers();
