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
    
    console.log('--- DB-SIDE STATISTICS AUDIT ---');
    
    // Audit 1: Unapplied Mode
    const unRes = await axios.get('http://localhost:5000/api/jobs', { 
      params: { applicationStatus: 'Unapplied' }, 
      headers: { 'x-auth-token': token } 
    });
    console.log(`\n[Workflow: Unapplied]`);
    console.log(`- Header Count (Total): ${unRes.data.totalJobs}`);
    console.log(`- Sidebar Fullstack Count: ${unRes.data.stats.Fullstack}`);
    
    // Audit 2: Applied Mode 
    const appRes = await axios.get('http://localhost:5000/api/jobs', { 
      params: { applicationStatus: 'Applied' }, 
      headers: { 'x-auth-token': token } 
    });
    console.log(`\n[Workflow: Applied]`);
    console.log(`- Header Count (Total): ${appRes.data.totalJobs}`);
    console.log(`- Sidebar Fullstack Count: ${appRes.data.stats.Fullstack}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
})();
