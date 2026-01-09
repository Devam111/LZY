const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Test login
const testLogin = async () => {
  try {
    await connectDB();
    
    const user = await SignupUser.findOne({ email: 'john.smith@student.edu' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔐 Password hash:', user.password);
    
    // Test password comparison
    const testPassword = 'student123';
    const isValid = await user.comparePassword(testPassword);
    console.log('🔑 Password valid:', isValid);
    
    // Test with bcryptjs directly
    const directCompare = await bcrypt.compare(testPassword, user.password);
    console.log('🔑 Direct bcryptjs compare:', directCompare);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

testLogin();
