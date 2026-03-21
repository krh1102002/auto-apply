/**
 * One-shot hourly pipeline — for Render Cron Jobs (run command, then exit).
 * https://render.com/docs/cronjobs
 */
const { runHourlyCycle } = require('./hourlyCycle');

runHourlyCycle()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Cron] Cycle failed:', err.message);
    process.exit(1);
  });
