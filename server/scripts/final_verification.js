const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({});
    if (!user) throw new Error('No user found');

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    console.log('--- FINAL API VERIFICATION ---');
    
    // Test Fresher Mode
    const fresherRes = await axios.get('http://localhost:5000/api/jobs', { 
      params: { experienceLevel: 'Entry' }, 
      headers: { 'x-auth-token': token } 
    });
    console.log('\n[Fresher Mode]');
    console.log(`- Pulse Count (Entry): ${fresherRes.data.totalJobs}`);
    console.log(`- Jobs Returned: ${fresherRes.data.jobs.length}`);
    console.log(`- Sample Role: ${fresherRes.data.jobs[0]?.title || 'None'}`);
    console.log(`- Fullstack Count: ${fresherRes.data.stats.Fullstack}`);

    // Test Experienced Mode
    const expRes = await axios.get('http://localhost:5000/api/jobs', { 
      params: { experienceLevel: ['Mid', 'Senior'] }, 
      headers: { 'x-auth-token': token } 
    });
    console.log('\n[Experienced Mode]');
    console.log(`- Pulse Count (Mid/Sr): ${expRes.data.totalJobs}`);
    console.log(`- Fullstack Count: ${expRes.data.stats.Fullstack}`);

    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  }
})();
