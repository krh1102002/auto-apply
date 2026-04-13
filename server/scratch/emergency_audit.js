const mongoose = require('mongoose');
require('dotenv').config();
const Application = require('../models/Application');
const Job = require('../models/Job');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const apps = await Application.find({ status: 'Applied' }).populate('jobId');
    
    // Stricter indicators of seniority
    const seniorPatterns = /senior|lead|principal|staff|architect|manager|director|vp|head|sr\.|specialist|vp|president|director/i;

    const leaks = apps.filter(a => seniorPatterns.test(a.jobId?.title || ''));

    console.log(`--- EMERGENCY SENIORITY AUDIT ---`);
    console.log(`Total Applied roles: ${apps.length}`);
    console.log(`Misclassified Leaks (Senior/Director): ${leaks.length}`);
    
    if (leaks.length > 0) {
        console.log(`\nLEAKED ROLES (TO BE CLEANED):`);
        leaks.forEach((l, i) => {
            console.log(`${i+1}. [${l.jobId.title}] at ${l.jobId.company}`);
        });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
