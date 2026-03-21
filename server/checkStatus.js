const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Application = require('./models/Application');
const Job = require('./models/Job');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const statuses = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const withScreenshots = await Application.countDocuments({ screenshot: { $exists: true } });
    console.log('--- Detailed Application Progress ---');
    console.log('By Status:', JSON.stringify(statuses, null, 2));
    console.log('With Visual Proof (Screenshots):', withScreenshots);
    
    const recentlyApplied = await Application.find({ status: { $in: ['Applied', 'Pending'] } })
      .populate('jobId')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('--- Submissions Overview ---');
    recentlyApplied.forEach((app, i) => {
      const companyName = app.jobId ? app.jobId.company : 'Unknown Company';
      const jobTitle = app.jobId ? app.jobId.title : 'Unknown Role';
      console.log(`${i + 1}. [${app.status}] ${companyName} - ${jobTitle}`);
    });
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
