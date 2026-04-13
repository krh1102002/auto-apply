const cron = require('node-cron');
const { runHourlyCycle } = require('./hourlyCycle');

const safeRun = () => {
  runHourlyCycle().catch((err) => {
    console.error('[Cron] Cycle failed:', err.message);
  });
};

// Run immediately on startup (with a small delay to ensure DB is ready), then every hour at minute 0
setTimeout(safeRun, 5000); 
cron.schedule('0 * * * *', safeRun);
console.log('⏰ [Cron] Scheduler active. Hourly cycles will run at minute 0.');
