const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDashboard() {
  try {
    console.log('Testing Student Dashboard Endpoints...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', health.data);

    // Test study session start
    console.log('\n2. Testing study session start...');
    const sessionStart = await axios.post(`${BASE_URL}/study-sessions/start`, {
      courseId: null,
      activity: 'browsing'
    });
    console.log('✅ Session started:', sessionStart.data);

    // Test study session end
    console.log('\n3. Testing study session end...');
    const sessionEnd = await axios.post(`${BASE_URL}/study-sessions/end`);
    console.log('✅ Session ended:', sessionEnd.data);

    console.log('\n🎉 All tests passed! Dashboard endpoints are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDashboard();
}

module.exports = { testDashboard };

