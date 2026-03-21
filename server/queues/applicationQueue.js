const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const Application = require('../models/Application');
const { automateApplication } = require('../services/puppeteerService');

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => null // Don't retry indefinitely if redis is missing
});

const applicationQueue = new Queue('application-automation', { connection });

// Worker to process application tasks
const worker = new Worker('application-automation', async (job) => {
  const { applicationId, userId, jobDetails, userProfile } = job.data;
  
  console.log(`Processing REAL-WORLD application ${applicationId} for job: ${jobDetails.title}`);

  try {
    // Execute Puppeteer automation
    const result = await automateApplication(applicationId, jobDetails.url, userProfile);

    if (result.success) {
      // Update status to 'Applied'
      await Application.findByIdAndUpdate(applicationId, { 
        status: 'Applied',
        notes: result.message,
        screenshot: result.screenshot
      });
      console.log(`Successfully applied for: ${jobDetails.title}`);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error(`Application failed for ${applicationId}:`, error.message);
    await Application.findByIdAndUpdate(applicationId, { status: 'Failed', notes: error.message });
  }
}, { connection });

worker.on('error', err => {
  console.error('Queue Worker Error:', err.message);
});

module.exports = { applicationQueue };
