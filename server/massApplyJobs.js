const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');
const Application = require('./models/Application');
const User = require('./models/User');
const { applicationQueue } = require('./queues/applicationQueue');
const EXIT_AFTER_QUEUE = process.env.EXIT_AFTER_QUEUE === 'true';

const TARGET_ROLE_KEYWORDS = [
  'software engineer',
  'full stack',
  'full-stack',
  'java developer',
  'backend',
  'frontend',
  'android',
  'ios',
  'mobile',
  'react',
  'angular',
  'spring',
  'node'
];

const RESUME_SKILL_KEYWORDS = [
  'java',
  'spring boot',
  'react',
  'angular',
  'node',
  'express',
  'kotlin',
  'swift',
  'mysql',
  'postgresql',
  'typescript',
  'react native'
];

const EASY_APPLY_HOSTS = ['greenhouse.io', 'lever.co'];

const PROFILE = {
  name: 'Sanika Sarwadnya',
  email: 'sanikasarwadnya@gmail.com',
  phone: '+91-9307872783',
  linkedin: 'https://www.linkedin.com/in/sanika-sarwadnya-388b42212/',
  github: 'https://github.com/SanikaSarwadnya',
  resumePath: process.env.RESUME_FILE_PATH
    || String.raw`C:\Users\hulke\AppData\Roaming\Cursor\User\workspaceStorage\7561ef34e49bb30f8e9262141fc8bbe9\pdfs\ef8fb15a-e8ea-4127-bb2d-6832ea78135b\Sanika_Sarwadnya (1).pdf`
};

const hasKeyword = (text, keywords) => {
  const value = (text || '').toLowerCase();
  return keywords.some((keyword) => value.includes(keyword));
};

const isRelevantJob = (job) => {
  const haystack = `${job.title || ''} ${job.description || ''}`;
  return hasKeyword(haystack, TARGET_ROLE_KEYWORDS) || hasKeyword(haystack, RESUME_SKILL_KEYWORDS);
};

const isEasyApplySource = (job) => EASY_APPLY_HOSTS.some((host) => (job.url || '').includes(host));

const massApplyGlobal = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for Global Rollout');

    // Find the test user
    const user = await User.findOne({ email: PROFILE.email });
    if (!user) {
      console.error(`User "${PROFILE.email}" not found.`);
      process.exit(1);
    }

    // Clear old applications
    await Application.deleteMany({ userId: user._id });
    console.log('🗑️ Cleared previous applications.');

    // Find all unapplied open jobs
    const jobs = await Job.find({ status: 'Open' });
    const relevantJobs = jobs.filter(isRelevantJob);
    const easyApplyFirst = [
      ...relevantJobs.filter(isEasyApplySource),
      ...relevantJobs.filter((job) => !isEasyApplySource(job))
    ];
    console.log(`🚀 Found ${jobs.length} open jobs, ${relevantJobs.length} resume-matching roles.`);
    console.log(`⚡ Queueing ${easyApplyFirst.length} jobs (easy-apply sources first).`);

    for (const job of easyApplyFirst) {
      try {
        const application = new Application({
          userId: user._id,
          jobId: job._id,
          status: 'Pending',
          platformUsed: job.source || 'Direct',
          notes: `Universal Global Automation: ${job.url}`
        });
        await application.save();

        await applicationQueue.add('submit-application', {
          applicationId: application._id,
          userId: user._id,
          jobDetails: { title: job.title, company: job.company, url: job.url },
          userProfile: {
            name: PROFILE.name || user.name,
            email: PROFILE.email || user.email,
            phone: PROFILE.phone,
            resumePath: PROFILE.resumePath,
            preferences: {
              linkedin: PROFILE.linkedin,
              github: PROFILE.github,
              ...user.preferences
            }
          }
        });

        console.log(`[QUEUED] ${job.company} - ${job.title}`);
      } catch (e) {
        console.error(`[ERROR] Failed to queue ${job.company}:`, e.message);
      }
    }

    console.log('\n✨ All global applications have been queued successfully.');
    console.log('Monitor the dashboard for real-time visual proof from Puppeteer.');
    if (EXIT_AFTER_QUEUE) {
      setTimeout(() => process.exit(0), 1000);
      return;
    }

    console.log('⏳ Worker kept alive to process queued applications (CTRL+C to stop).');
    setInterval(async () => {
      try {
        const queueStats = await applicationQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
        const appStats = await Application.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('[HEARTBEAT]', JSON.stringify({ queueStats, appStats }));
      } catch (heartbeatErr) {
        console.error('Heartbeat error:', heartbeatErr.message);
      }
    }, 30000);
  } catch (err) {
    console.error('❌ Global Mass Apply Failed:', err.stack);
    process.exit(1);
  }
};

massApplyGlobal();
