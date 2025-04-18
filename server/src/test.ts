import axios from 'axios';

const API_URL = 'http://localhost:4001/api';
let authToken: string;

async function testUserEndpoints() {
  try {
    // Test registration
    console.log('\nTesting registration...');
    const registerResponse = await axios.post(`${API_URL}/users/register`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });
    console.log('Registration successful:', registerResponse.data);
    authToken = registerResponse.data.token;

    // Test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login successful:', loginResponse.data);
    authToken = loginResponse.data.token;

    // Test get profile
    console.log('\nTesting get profile...');
    const profileResponse = await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Profile retrieved:', profileResponse.data);

    // Test update profile
    console.log('\nTesting update profile...');
    const updateResponse = await axios.patch(
      `${API_URL}/users/profile`,
      { displayName: 'Updated Name' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('Profile updated:', updateResponse.data);

  } catch (error: any) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run tests
console.log('Starting user endpoint tests...');
testUserEndpoints(); 