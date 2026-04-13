const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('../models/Job');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const entryJobs = await Job.find({ experienceLevel: 'Entry' });
    
    // Patterns that definitely mean NOT Entry
    const seniorPatterns = /senior|lead|principal|staff|architect|manager|head|director|expert|specialist/i;
    const expPatterns = /\d+\s*\+?\s*years?|exp:?\s*\d+/i;

    const leakage = entryJobs.filter(j => 
        seniorPatterns.test(j.title) || 
        expPatterns.test(j.title) ||
        expPatterns.test(j.description)
    );

    console.log(`--- Seniority Leakage Analysis ---`);
    console.log(`Total Entry Roles: ${entryJobs.length}`);
    console.log(`Potential Leaks Found: ${leakage.length}`);
    console.log(`\nSample Leaking Roles:`);
    leakage.slice(0, 20).forEach((j, i) => {
        console.log(`${i+1}. [${j.title}]`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
