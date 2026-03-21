const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Application = require('./models/Application');
const Job = require('./models/Job');
const User = require('./models/User');
const { automateApplication } = require('./services/puppeteerService');

const forceProcessOne = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a pending application
    const app = await Application.findOne({ status: 'Pending' }).populate('jobId');
    if (!app) {
      console.log('No pending applications found. Creating a test one...');
      const user = await User.findOne();
      const job = await Job.findOne();
      const newApp = new Application({
        userId: user._id,
        jobId: job._id,
        status: 'Pending',
        platformUsed: job.source
      });
      await newApp.save();
      return forceProcessOne(); // Recursively call with new app
    }

    console.log(`Force processing app ${app._id} for ${app.jobId.company}...`);
    
    const user = await User.findById(app.userId);
    const result = await automateApplication(app._id, app.jobId.url, {
      name: user.name,
      email: user.email,
      phone: '555-0199'
    });

    if (result.success) {
      await Application.findByIdAndUpdate(app._id, {
        status: 'Applied',
        screenshot: result.screenshot,
        notes: result.message
      });
      console.log('SUCCESS: Application processed and database updated.');
      console.log('Screenshot Path:', result.screenshot);
    } else {
      console.error('FAILURE:', result.message);
    }

    process.exit();
  } catch (err) {
    console.error('Error in force process:', err);
    process.exit(1);
  }
};

forceProcessOne();
