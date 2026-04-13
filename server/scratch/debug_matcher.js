const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Job = require('../models/Job');

const isMatchBySettings = (job, settings) => {
  const roleKeywords = settings.roleKeywords || [];
  const experienceLevels = settings.experienceLevels || [];
  const countries = settings.countries || [];

  if (roleKeywords.length > 0) {
    const haystack = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    if (!roleKeywords.some((k) => haystack.includes(String(k).toLowerCase()))) {
      return { match: false, reason: 'Role Mismatch' };
    }
  }

  if (experienceLevels.length > 0 && !experienceLevels.includes(job.experienceLevel)) {
    return { match: false, reason: `Exp Mismatch (${job.experienceLevel})` };
  }

  if (countries.length > 0) {
    const loc = (job.location || '').toLowerCase();
    const isIndiaHub = countries.some(c => c.toLowerCase() === 'india') && 
      /bangalore|bengaluru|pune|mumbai|hyderabad|gurgaon|noida|chennai|delhi/i.test(loc);
    const isRemote = /remote|global|anywhere/i.test(loc);
    
    if (!countries.some((c) => loc.includes(String(c).toLowerCase())) && !isIndiaHub && !isRemote) {
      return { match: false, reason: `Location Mismatch (${job.location})` };
    }
  }

  return { match: true };
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'sanikasarwadnya@gmail.com' });
    const automation = user.preferences?.automation || {};
    
    const jobs = await Job.find({ status: 'Open' }).limit(100);
    console.log(`--- Match Diagnosis for ${user.email} ---`);
    console.log(`Settings: ${JSON.stringify(automation)}\n`);
    
    let matches = 0;
    for (const j of jobs) {
       const res = isMatchBySettings(j, automation);
       if (res.match) {
           console.log(`✅ [MATCH] ${j.title} | ${j.location}`);
           matches++;
       }
    }
    
    console.log(`\nFound ${matches} valid matches out of ${jobs.length} roles checked.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
