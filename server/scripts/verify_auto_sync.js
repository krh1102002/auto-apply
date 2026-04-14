const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Job = require('../models/Job');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: process.env.AUTO_USER_EMAIL || 'sanikasarwadnya@gmail.com' });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    const automation = user.preferences?.automation || {};
    const jobs = await Job.find({ status: 'Open' }).lean();
    
    const allowedForEntry = ['Entry', 'Unknown'];
    let oldMatches = 0;
    let newMatches = 0;

    console.log('--- AUTOMATION SYNC AUDIT ---');
    console.log(`Analyzing Pool: ${jobs.length} roles\n`);

    jobs.forEach(job => {
      const haystack = (job.title + ' ' + (job.description || '')).toLowerCase();
      const roleMatched = automation.roleKeywords.some(k => haystack.includes(k.toLowerCase()));
      
      if (roleMatched) {
        // Old logic match (Restrictive)
        if (job.experienceLevel === 'Entry') oldMatches++;
        
        // New logic match (Optimistic / Signal Boosted)
        if (allowedForEntry.includes(job.experienceLevel)) newMatches++;
      }
    });

    console.log(`[RESULTS]`);
    console.log(`- PREVIOUS Application Capacity: ${oldMatches} roles`);
    console.log(`- CURRENT Application Capacity: ${newMatches} roles`);
    console.log(`- VOLUME INCREASE: +${Math.round(((newMatches - oldMatches)/oldMatches) * 100)}%`);

    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
})();
