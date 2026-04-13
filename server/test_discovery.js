const mongoose = require('mongoose');
const { discoverAllJobs } = require('./services/discoveryService');
require('dotenv').config();

const testDiscovery = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await discoverAllJobs();
    console.log('Discovery result:', result);

    process.exit(0);
  } catch (error) {
    console.error('Discovery test failed:', error);
    process.exit(1);
  }
};

testDiscovery();
