import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:4001/api';
let authToken: string;

async function testAuth() {
  try {
    // Register
    const registerResponse = await axios.post(`${API_URL}/users/register`, {
      username: process.env.TEST_USERNAME || 'testuser',
      email: process.env.TEST_EMAIL || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'testpassword123'
    });
    console.log('Register successful:', registerResponse.data);
    authToken = registerResponse.data.token;

    // Login
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      email: process.env.TEST_EMAIL || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'testpassword123'
    });
    console.log('Login successful:', loginResponse.data);
    authToken = loginResponse.data.token;

    // Get Profile
    const profileResponse = await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Profile:', profileResponse.data);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth(); 