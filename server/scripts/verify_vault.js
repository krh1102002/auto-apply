const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({});
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    console.log('--- SENIORITY VAULT VERIFICATION ---');
    
    // TEST 1: Naked Request (No params at all)
    // Before this fix, this would return 1,003 roles. 
    // Now it should return only Entry roles (~200 after discovery).
    const nakedRes = await axios.get('http://localhost:5000/api/jobs', { 
      params: {}, 
      headers: { 'x-auth-token': token } 
    });
    
    console.log(`\n[Naked Request - No Params]`);
    console.log(`- Pulse Count: ${nakedRes.data.totalJobs}`);
    console.log(`- First Job Title: ${nakedRes.data.jobs[0]?.title}`);
    console.log(`- First Job Experience: ${nakedRes.data.jobs[0]?.experienceLevel}`);
    
    const hasSenior = nakedRes.data.jobs.some(j => j.experienceLevel === 'Senior');
    console.log(`- Contains Senior Roles? ${hasSenior ? '⚠️ YES (FAILED)' : '✅ NO (PASSED)'}`);

    process.exit(0);
  } catch (err) {
    console.error('Vault verification failed:', err.message);
    process.exit(1);
  }
})();
