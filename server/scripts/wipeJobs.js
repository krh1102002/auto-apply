const mongoose = require('mongoose');
require('dotenv').config();

const wipeJobs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Job = require('../models/Job');
    const result = await Job.deleteMany({});
    
    console.log(`Successfully wiped ${result.deletedCount} jobs from the database.`);
    process.exit(0);
  } catch (error) {
    console.error('Wipe failed:', error);
    process.exit(1);
  }
};

wipeJobs();
