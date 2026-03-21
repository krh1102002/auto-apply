const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Application = require('./models/Application');
require('./models/Job');
const User = require('./models/User');
const { applicationQueue } = require('./queues/applicationQueue');
const MAX_RETRIES = Number(process.env.MAX_RETRIES_PER_APPLICATION || 2);

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const failedApps = await Application.find({ status: 'Failed' }).populate('jobId');
    if (!failedApps.length) {
      console.log('ℹ️ No failed applications found.');
      process.exit(0);
    }

    let queued = 0;
    let skipped = 0;
    let markedForDebug = 0;

    for (const app of failedApps) {
      if (!app.jobId || !app.userId) {
        skipped += 1;
        continue;
      }

      if ((app.retryCount || 0) >= MAX_RETRIES) {
        app.debugRequired = true;
        await app.save();
        markedForDebug += 1;
        continue;
      }

      const user = await User.findById(app.userId).select('-password');
      if (!user) {
        skipped += 1;
        continue;
      }

      app.status = 'Pending';
      app.notes = `${app.notes || ''}\n[Retry] Re-queued once after failure at ${new Date().toISOString()}`.trim();
      await app.save();

      await applicationQueue.add('submit-application', {
        applicationId: app._id,
        userId: user._id,
        jobDetails: {
          title: app.jobId.title,
          company: app.jobId.company,
          url: app.jobId.url
        },
        userProfile: user
      });

      queued += 1;
      console.log(`[RETRY-QUEUED] ${app.jobId.company} - ${app.jobId.title}`);
    }

    console.log(`\n✅ Retry complete. Queued: ${queued}, Skipped: ${skipped}, DebugRequired: ${markedForDebug}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Retry failed:', err.message);
    process.exit(1);
  }
};

run();
