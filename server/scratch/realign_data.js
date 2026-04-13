const mongoose = require('mongoose');
const Job = require('../models/Job');
const { categorizeExperienceLevel, isRelevant, isIndiaOrRemote } = require('../services/discoveryService');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const jobs = await Job.find({ status: 'Open' });
    console.log(`Realignment: Processing ${jobs.length} jobs...`);

    let updatedCount = 0;
    let deletedCount = 0;

    for (const job of jobs) {
      // 1. Re-check Relevance (stricter Title-based check now)
      if (!isRelevant(job.title, job.description) || !isIndiaOrRemote(job.location)) {
        await Job.deleteOne({ _id: job._id });
        deletedCount++;
        continue;
      }

      // 2. Re-calculate Seniority (new 'Entry' default)
      const newExp = categorizeExperienceLevel(job.title, job.description);
      if (newExp !== job.experienceLevel) {
        job.experienceLevel = newExp;
        await job.save();
        updatedCount++;
      }
    }

    console.log(`✅ Success: ${updatedCount} updated, ${deletedCount} purged.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
