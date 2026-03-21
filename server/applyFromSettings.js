const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');
const { applicationQueue } = require('./queues/applicationQueue');

const DEFAULT_USER_EMAIL = process.env.AUTO_USER_EMAIL || 'sanikasarwadnya@gmail.com';

const textHasAny = (value, keywords) => {
  const lower = String(value || '').toLowerCase();
  return keywords.some((k) => lower.includes(String(k).toLowerCase()));
};

const isMatchBySettings = (job, settings) => {
  const roleKeywords = settings.roleKeywords || [];
  const experienceLevels = settings.experienceLevels || [];
  const countries = settings.countries || [];

  if (roleKeywords.length > 0) {
    const haystack = `${job.title || ''} ${job.description || ''}`;
    if (!textHasAny(haystack, roleKeywords)) return false;
  }

  if (experienceLevels.length > 0 && !experienceLevels.includes(job.experienceLevel)) {
    return false;
  }

  if (countries.length > 0 && !textHasAny(job.location || '', countries)) {
    return false;
  }

  return true;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Job.syncIndexes();

    const user = await User.findOne({ email: DEFAULT_USER_EMAIL });
    if (!user) {
      throw new Error(`User not found for AUTO_USER_EMAIL=${DEFAULT_USER_EMAIL}`);
    }

    const automation = user.preferences?.automation || {};
    if (automation.enabled === false) {
      console.log('ℹ️ Automation disabled by dashboard setting.');
      process.exit(0);
    }

    // Large sorts can exceed MongoDB's ~32MB in-memory cap without index/disk use.
    let jobs;
    try {
      jobs = await Job.aggregate(
        [{ $match: { status: 'Open' } }, { $sort: { detectedAt: -1 } }, { $limit: 8000 }],
        { allowDiskUse: true }
      );
    } catch (aggErr) {
      console.warn('⚠️ Aggregate query failed, using indexed find fallback:', aggErr.message);
      jobs = await Job.find({ status: 'Open' })
        .sort({ detectedAt: -1 })
        .limit(8000)
        .hint({ status: 1, detectedAt: -1 })
        .lean();
    }
    const filtered = jobs.filter((job) => isMatchBySettings(job, automation));
    let queued = 0;

    for (const job of filtered) {
      const existing = await Application.findOne({ userId: user._id, jobId: job._id });
      if (existing) continue;

      const application = new Application({
        userId: user._id,
        jobId: job._id,
        status: 'Pending',
        platformUsed: job.source || 'Direct',
        notes: `Auto-filtered apply (${new Date().toISOString()})`
      });
      await application.save();

      await applicationQueue.add('submit-application', {
        applicationId: application._id,
        userId: user._id,
        jobDetails: { title: job.title, company: job.company, url: job.url },
      });

      queued += 1;
    }

    console.log(`✅ Filtered apply complete. Matched: ${filtered.length}, Newly queued: ${queued}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Filtered apply failed:', err.message);
    process.exit(1);
  }
};

run();
