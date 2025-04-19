import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.API_URL || !process.env.TEST_USERNAME || !process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
  console.error('Missing required environment variables for testing');
  process.exit(1);
}

const API_URL = process.env.API_URL;
let authToken: string;

async function testAuth() {
  try {
    // Register
    const registerResponse = await axios.post(`${API_URL}/users/register`, {
      username: process.env.TEST_USERNAME,
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD
    });
    console.log('Register successful:', registerResponse.data);
    authToken = registerResponse.data.token;

    // Login
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD
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