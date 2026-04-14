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
    const haystack = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    if (!roleKeywords.some((k) => haystack.includes(String(k).toLowerCase()))) {
      return { match: false, reason: 'Role Mismatch' };
    }
  }

  if (experienceLevels.length > 0) {
    // Optimistic Synchronization: Allow 'Unknown' roles to bypass the strict block if they lack Senior keywords
    // This allows the 300+ roles we unlocked in the UI to be eligible for automation.
    const allowedForEntry = ['Entry', 'Unknown'];
    if (experienceLevels.includes('Entry') && !allowedForEntry.includes(job.experienceLevel)) {
      return { match: false, reason: `Exp Mismatch (${job.experienceLevel})` };
    }
    
    // Explicit match check for other levels
    if (!experienceLevels.includes('Entry') && !experienceLevels.includes(job.experienceLevel)) {
      return { match: false, reason: `Exp Mismatch (${job.experienceLevel})` };
    }
  }

  if (countries.length > 0) {
    const loc = (job.location || '').toLowerCase();
    const isIndiaHub = countries.some(c => c.toLowerCase() === 'india') && 
      /bangalore|bengaluru|pune|mumbai|hyderabad|gurgaon|noida|chennai|delhi/i.test(loc);
    const isRemote = /remote|global|anywhere/i.test(loc);
    
    if (!countries.some((c) => loc.includes(String(c).toLowerCase())) && !isIndiaHub && !isRemote) {
      return { match: false, reason: `Location Mismatch (${job.location})` };
    }
  }

  return { match: true };
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
    const matchingResults = jobs.map((job) => ({ job, ...isMatchBySettings(job, automation) }));
    const filtered = matchingResults.filter(r => r.match).map(r => r.job);
    const skipped = matchingResults.filter(r => !r.match);

    if (skipped.length > 0) {
      console.log(`ℹ️ Skipped ${skipped.length} roles due to filters. Sample reasons:`);
      skipped.slice(0, 5).forEach(s => console.log(`  - [${s.reason}] ${s.job.title}`));
    }

    let queued = 0;

    for (const job of filtered) {
      let application = await Application.findOne({ userId: user._id, jobId: job._id });
      
      if (application) {
        if (application.status === 'Pending') {
          console.log(`ℹ️ Re-queuing existing pending application for: ${job.company}`);
        } else {
          continue; // Job already applied or failed
        }
      } else {
        application = new Application({
          userId: user._id,
          jobId: job._id,
          status: 'Pending',
          platformUsed: job.source || 'Direct',
          notes: `Auto-filtered apply (${new Date().toISOString()})`
        });
        await application.save();
        queued += 1;
      }

      await applicationQueue.add('submit-application', {
        applicationId: application._id,
        userId: user._id,
        jobDetails: { title: job.title, company: job.company, url: job.url },
      });
    }

    console.log(`✅ Filtered apply complete. Matched: ${filtered.length}, Newly queued: ${queued}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Filtered apply failed:', err.message);
    process.exit(1);
  }
};

run();
