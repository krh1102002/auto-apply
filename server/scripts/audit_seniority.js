const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('../models/Job');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('--- SENIORITY DISTRIBUTION AUDIT ---');
    
    const counts = await Job.aggregate([
      { $group: { _id: '$experienceLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nCurrent repartion in DB:');
    counts.forEach(c => console.log(`- ${c._id || 'UNSET'}: ${c.count}`));
    
    console.log('\n--- SAMPLE: UNKNOWN/MID-SENIOR ROLES (POTENTIAL FALSE NEGATIVES) ---');
    const samples = await Job.find({ 
      experienceLevel: { $in: ['Unknown', 'Mid/Senior', null] } 
    }).limit(10).select('title company experienceLevel source');
    
    samples.forEach(s => console.log(`[${s.source}] ${s.title} @ ${s.company} (${s.experienceLevel})`));

    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
})();
