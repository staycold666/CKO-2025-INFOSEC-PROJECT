const axios = require('axios');

// Mock token (same as in authSlice.ts)
const mockToken = 'mock-token-for-testing';

// API URL
const API_URL = 'http://localhost:3001/api';

// Test function
async function testAuthBypass() {
  console.log('Testing authentication bypass...');
  
  // Create axios instance with auth header
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mockToken}`
    }
  });
  
  try {
    // Test 1: Try to get current user
    console.log('\nTest 1: Get current user');
    try {
      const userResponse = await api.get('/auth/me');
      console.log('Success! Got user:', userResponse.data);
    } catch (error) {
      console.error('Error getting user:', error.response?.data || error.message);
    }
    
    // Test 2: Try to get rooms
    console.log('\nTest 2: Get rooms');
    try {
      const roomsResponse = await api.get('/rooms');
      console.log('Success! Got rooms:', roomsResponse.data);
    } catch (error) {
      console.error('Error getting rooms:', error.response?.data || error.message);
    }
    
    // Test 3: Try to create a room
    console.log('\nTest 3: Create room');
    try {
      const createRoomResponse = await api.post('/rooms', {
        name: 'Test Room',
        settings: {
          timeLimit: 300,
          scoreLimit: 20,
          mapId: 'map1',
          friendlyFire: false
        }
      });
      console.log('Success! Created room:', createRoomResponse.data);
    } catch (error) {
      console.error('Error creating room:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testAuthBypass();
