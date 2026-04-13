const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const { discoverAllJobs } = require('./server/services/discoveryService');

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const result = await discoverAllJobs();
    console.log('Test Result:', result);

    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
}

test();
