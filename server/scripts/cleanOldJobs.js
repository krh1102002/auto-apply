const mongoose = require('mongoose');
const Job = require('../models/Job');
require('dotenv').config();

const cleanOldJobs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for cleanup');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Job.deleteMany({
      $or: [
        { postedAt: { $lt: thirtyDaysAgo } },
        { postedAt: { $exists: false }, detectedAt: { $lt: thirtyDaysAgo } }
      ]
    });

    console.log(`Successfully purged ${result.deletedCount} stale job records.`);
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

cleanOldJobs();
