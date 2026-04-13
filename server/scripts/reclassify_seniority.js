const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('../models/Job');

// Re-using the hardened logic from discoveryService.js
const categorizeExperienceLevel = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  const isSenior = ['senior', 'sr.', 'lead', 'staff', 'principal', 'manager', 'director', 'vp', 'head', 'architect', 'expert', 'l4', 'l5', 'l6', '8+ years', '10+ years'].some(k => text.includes(k));
  const isMid = ['mid', 'intermediate', 'ii', 'iii', 'level 2', 'level 3', 'l2', 'l3', '3+ years', '4+ years', '5+ years', 'specialist'].some(k => text.includes(k));
  const isFresher = ['fresher', 'entry', 'junior', 'intern', 'graduate', 'trainee', 'associate', '0 years', '0-1 years', '0-2 years', 'l1', 'level 1', 'level i', 'internship', 'apprentice'].some(k => text.includes(k));

  if (isSenior) return 'Senior';
  if (isMid) return 'Mid';
  if (isFresher) return 'Entry';
  if (/ director| manager| principal| lead | staff | architect| ii | iii | iv | v /i.test(title)) return 'Mid/Senior';
  return 'Unknown';
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const jobs = await Job.find({});
    console.log(`--- GLOBAL RE-CLASSIFICATION ---`);
    console.log(`Processing ${jobs.length} roles...`);

    let changes = 0;
    for (const job of jobs) {
      const newLevel = categorizeExperienceLevel(job.title, job.description || '');
      if (job.experienceLevel !== newLevel) {
        job.experienceLevel = newLevel;
        await job.save();
        changes++;
      }
    }

    console.log(`✅ Completed. Re-classified ${changes} roles.`);
    
    // Final check on counts
    const entryCount = await Job.countDocuments({ experienceLevel: 'Entry' });
    console.log(`Final Entry Count: ${entryCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
