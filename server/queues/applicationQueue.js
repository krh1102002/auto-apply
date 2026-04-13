const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const Application = require('../models/Application');
const { automateApplication } = require('../services/puppeteerService');
const { loadUserProfileForAutomation } = require('../utils/automationUserProfile');

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) return true;
    return false;
  }
});

/** Small Redis (e.g. 30MB): tiny job payloads + aggressive cleanup of finished jobs */
const QUEUE_JOB_OPTIONS = {
  removeOnComplete: true,
  removeOnFail: { count: 20 },
  attempts: 2,
  backoff: { type: 'fixed', delay: 8000 },
};

const applicationQueue = new Queue('application-automation', {
  connection,
  defaultJobOptions: QUEUE_JOB_OPTIONS,
});

// Worker to process application tasks
const worker = new Worker(
  'application-automation',
  async (job) => {
    const { applicationId, userId, jobDetails, userProfile: legacyProfile } = job.data;

    const userProfile = userId
      ? await loadUserProfileForAutomation(userId)
      : legacyProfile;
    if (!userProfile) {
      throw new Error('Job data must include userId (or legacy userProfile)');
    }

    console.log(`Processing REAL-WORLD application ${applicationId} for job: ${jobDetails.title}`);

    try {
      const result = await automateApplication(applicationId, jobDetails.url, userProfile);

      if (result.success) {
        await Application.findByIdAndUpdate(applicationId, {
          status: 'Applied',
          notes: result.message,
          screenshot: result.screenshot,
          lastError: null,
          debugRequired: false,
          lastTriedAt: new Date(),
        });
        console.log(`Successfully applied for: ${jobDetails.title}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(`Application failed for ${applicationId}:`, error.message);
      await Application.findByIdAndUpdate(applicationId, {
        $set: {
          status: 'Failed',
          notes: error.message,
          lastError: error.message,
          lastTriedAt: new Date(),
        },
        $inc: { retryCount: 1 },
      });
    }
  },
  {
    connection,
    concurrency: 1,
  },
);

worker.on('error', err => {
  console.error('Queue Worker Error:', err.message);
});

module.exports = { applicationQueue };
