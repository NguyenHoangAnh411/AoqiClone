const axios = require('axios');

const BASE_URL = 'http://localhost:9000/api';
let authToken = '';
let testUserId = '';

// Test data
const testUser = {
  username: 'testuser_' + Math.floor(Math.random() * 1000),
  email: `testuser_${Math.floor(Math.random() * 1000)}@example.com`,
  password: 'password123',
  displayName: 'Test User'
};

const testUser2 = {
  username: 'testuser2_' + Math.floor(Math.random() * 1000),
  email: `testuser2_${Math.floor(Math.random() * 1000)}@example.com`,
  password: 'password123',
  displayName: 'Test User 2'
};

// Helper function để log kết quả
function logResult(testName, success, data = null, error = null) {
  console.log(`\n${success ? '✅' : '❌'} ${testName}`);
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  if (error) {
    console.log('Error:', error);
  }
}

// Test functions
async function testRegister() {
  try {
    console.log('\n=== TESTING REGISTER ===');
    
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    logResult('Register User 1', true, response.data);
    
    const response2 = await axios.post(`${BASE_URL}/auth/register`, testUser2);
    logResult('Register User 2', true, response2.data);
    
    return true;
  } catch (error) {
    logResult('Register', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  try {
    console.log('\n=== TESTING LOGIN ===');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    
    authToken = response.data.data.token;
    testUserId = response.data.data.user._id;
    
    logResult('Login', true, {
      token: authToken ? 'Token received' : 'No token',
      userId: testUserId
    });
    
    return true;
  } catch (error) {
    logResult('Login', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testGetProfile() {
  try {
    console.log('\n=== TESTING GET PROFILE ===');
    
    const response = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Get Profile', true, response.data);
    return true;
  } catch (error) {
    logResult('Get Profile', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testUpdateProfile() {
  try {
    console.log('\n=== TESTING UPDATE PROFILE ===');
    
    const updateData = {
      displayName: 'Updated Test User',
      bio: 'This is an updated bio'
    };
    
    const response = await axios.put(`${BASE_URL}/users/profile`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Update Profile', true, response.data);
    return true;
  } catch (error) {
    logResult('Update Profile', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testUpdateAvatar() {
  try {
    console.log('\n=== TESTING UPDATE AVATAR ===');
    
    const avatarData = {
      avatar: 'https://example.com/avatar.jpg'
    };
    
    const response = await axios.put(`${BASE_URL}/users/avatar`, avatarData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Update Avatar', true, response.data);
    return true;
  } catch (error) {
    logResult('Update Avatar', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testGetUserStats() {
  try {
    console.log('\n=== TESTING GET USER STATS ===');
    
    const response = await axios.get(`${BASE_URL}/users/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Get User Stats', true, response.data);
    return true;
  } catch (error) {
    logResult('Get User Stats', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testAddCurrency() {
  try {
    console.log('\n=== TESTING ADD CURRENCY ===');
    
    const currencyData = {
      type: 'golds',
      amount: 500
    };
    
    const response = await axios.post(`${BASE_URL}/users/stats/currency/add`, currencyData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Add Currency', true, response.data);
    return true;
  } catch (error) {
    logResult('Add Currency', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testDeductCurrency() {
  try {
    console.log('\n=== TESTING DEDUCT CURRENCY ===');
    
    const currencyData = {
      type: 'golds',
      amount: 100
    };
    
    const response = await axios.post(`${BASE_URL}/users/stats/currency/deduct`, currencyData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Deduct Currency', true, response.data);
    return true;
  } catch (error) {
    logResult('Deduct Currency', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testUpdateUserStats() {
  try {
    console.log('\n=== TESTING UPDATE USER STATS ===');
    
    const statsData = {
      score: 1500,
      rank: 10,
      hasChosenStarterPet: true,
      tutorialCompleted: true
    };
    
    const response = await axios.put(`${BASE_URL}/users/stats`, statsData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Update User Stats', true, response.data);
    return true;
  } catch (error) {
    logResult('Update User Stats', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testGetUserStatistics() {
  try {
    console.log('\n=== TESTING GET USER STATISTICS ===');
    
    const response = await axios.get(`${BASE_URL}/users/statistics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Get User Statistics', true, response.data);
    return true;
  } catch (error) {
    logResult('Get User Statistics', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testSearchUsers() {
  try {
    console.log('\n=== TESTING SEARCH USERS ===');
    
    const response = await axios.get(`${BASE_URL}/users/search?q=testuser`);
    
    logResult('Search Users', true, response.data);
    return true;
  } catch (error) {
    logResult('Search Users', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testGetLeaderboard() {
  try {
    console.log('\n=== TESTING GET LEADERBOARD ===');
    
    const response = await axios.get(`${BASE_URL}/users/leaderboard?type=score&page=1&limit=10`);
    
    logResult('Get Leaderboard', true, response.data);
    return true;
  } catch (error) {
    logResult('Get Leaderboard', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testGetUserById() {
  try {
    console.log('\n=== TESTING GET USER BY ID ===');
    
    const response = await axios.get(`${BASE_URL}/users/${testUserId}`);
    
    logResult('Get User By ID', true, response.data);
    return true;
  } catch (error) {
    logResult('Get User By ID', false, null, error.response?.data || error.message);
    return false;
  }
}

async function testLogout() {
  try {
    console.log('\n=== TESTING LOGOUT ===');
    
    const response = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logResult('Logout', true, response.data);
    return true;
  } catch (error) {
    logResult('Logout', false, null, error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  const tests = [
    { name: 'Register', fn: testRegister },
    { name: 'Login', fn: testLogin },
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Update Profile', fn: testUpdateProfile },
    { name: 'Update Avatar', fn: testUpdateAvatar },
    { name: 'Get User Stats', fn: testGetUserStats },
    { name: 'Add Currency', fn: testAddCurrency },
    { name: 'Deduct Currency', fn: testDeductCurrency },
    { name: 'Update User Stats', fn: testUpdateUserStats },
    { name: 'Get User Statistics', fn: testGetUserStatistics },
    { name: 'Search Users', fn: testSearchUsers },
    { name: 'Get Leaderboard', fn: testGetLeaderboard },
    { name: 'Get User By ID', fn: testGetUserById },
    { name: 'Logout', fn: testLogout }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ name: test.name, success });
    } catch (error) {
      console.error(`Error in ${test.name}:`, error.message);
      results.push({ name: test.name, success: false });
    }
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please check the logs above.');
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testUser,
  testUser2
}; 