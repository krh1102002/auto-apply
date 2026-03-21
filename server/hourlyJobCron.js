const cron = require('node-cron');
const { runHourlyCycle } = require('./hourlyCycle');

const safeRun = () => {
  runHourlyCycle().catch((err) => {
    console.error('[Cron] Cycle failed:', err.message);
  });
};

// Run immediately on startup, then every hour at minute 0
safeRun();
cron.schedule('0 * * * *', safeRun);
console.log('[Cron] Scheduler active. Runs every hour at minute 0.');
