const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testApi() {
  const token = jwt.sign({ id: 'mockuserId' }, process.env.JWT_SECRET);
  console.log('Using token:', token);

  try {
    console.log('Triggering Refresh through API...');
    const res = await axios.post('http://localhost:5000/api/jobs/refresh', {}, {
      headers: { 'x-auth-token': token }
    });
    console.log('API Response:', res.status, res.data);
  } catch (err) {
    console.error('API Test Failed:', err.response?.data || err.message);
  }
}

testApi();
