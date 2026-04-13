const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const { discoverAllJobs } = require('./services/discoveryService');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for discovery update');

    await discoverAllJobs();

    process.exit(0);
  } catch (err) {
    console.error('❌ Discovery failed:', err.message);
    process.exit(1);
  }
};

run();
