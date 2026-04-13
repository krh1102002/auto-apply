const mongoose = require('mongoose');
require('dotenv').config();
const Application = require('../models/Application');
const Job = require('../models/Job');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Stricter indicators of seniority to ensure we only purge the leaks
    const seniorPatterns = /senior|lead|principal|staff|architect|manager|director|vp|head|sr\.|specialist|vp|president|director/i;

    const apps = await Application.find({}).populate('jobId');
    const toPurge = apps.filter(a => seniorPatterns.test(a.jobId?.title || ''));

    console.log(`--- SURGICAL SENIORITY PURGE ---`);
    console.log(`Identified ${toPurge.length} misclassified applications to remove.`);

    if (toPurge.length > 0) {
        const ids = toPurge.map(a => a._id);
        const result = await Application.deleteMany({ _id: { $in: ids } });
        console.log(`✅ Successfully deleted ${result.deletedCount} leaked records from the dashboard.`);
    } else {
        console.log(`ℹ️ No leaked records found to purge.`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
