const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Application = require('./models/Application');
require('./models/Job');

const classify = (message = '') => {
  const text = message.toLowerCase();
  if (text.includes('could not find chrome')) return 'Missing browser binary';
  if (text.includes('captcha')) return 'CAPTCHA/anti-bot challenge';
  if (text.includes('timeout')) return 'Navigation or selector timeout';
  if (text.includes('net::err') || text.includes('enotfound')) return 'Network/DNS failure';
  if (text.includes('login') || text.includes('invalid credentials')) return 'Authentication/login issue';
  return 'Other automation failure';
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const failures = await Application.find({ status: 'Failed' })
      .populate('jobId')
      .sort({ lastTriedAt: -1 })
      .limit(1000);

    if (!failures.length) {
      console.log('ℹ️ No failed applications to analyze.');
      process.exit(0);
    }

    const grouped = {};
    for (const item of failures) {
      const bucket = classify(item.lastError || item.notes || '');
      grouped[bucket] = (grouped[bucket] || 0) + 1;
    }

    console.log('--- Failure Diagnostics ---');
    Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .forEach(([reason, count]) => console.log(`${reason}: ${count}`));

    const persistent = failures.filter((f) => f.debugRequired);
    if (persistent.length) {
      console.log('\n--- Persistent Failures (Needs Manual Debug) ---');
      persistent.slice(0, 20).forEach((item, i) => {
        const title = item.jobId?.title || 'Unknown role';
        const company = item.jobId?.company || 'Unknown company';
        console.log(`${i + 1}. ${company} - ${title} | retries=${item.retryCount} | reason=${classify(item.lastError || item.notes || '')}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Analysis failed:', err.message);
    process.exit(1);
  }
};

run();
