const mongoose = require('mongoose');
require('dotenv').config();
const Application = require('../models/Application');
const Job = require('../models/Job');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Cleanup Orphaned Applications
    const apps = await Application.find().populate('jobId');
    const orphans = apps.filter(a => !a.jobId);
    if (orphans.length > 0) {
       await Application.deleteMany({ _id: { $in: orphans.map(o => o._id) } });
       console.log(`🧹 Purged ${orphans.length} orphaned applications (no associated Job).`);
    }

    // 2. Reset FAILURES for re-attempt
    const res = await Application.updateMany(
      { status: 'Failed' },
      { 
        $set: { 
          status: 'Pending', 
          lastError: null, 
          retryCount: 0 
        } 
      }
    );
    console.log(`🔄 RESET_SUCCESS: ${res.modifiedCount} failed applications moved back to Pending.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
