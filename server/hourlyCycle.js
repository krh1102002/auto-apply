/**
 * Shared hourly pipeline: discover → filtered apply → retry → analyze → status.
 * Used by hourlyJobCron.js (local scheduler) and runHourlyCycleOnce.js (Render cron / CI).
 */
const { spawn } = require('node:child_process');
require('dotenv').config({ path: './.env' });

const runCommand = (label, command, args = [], extraEnv = {}) =>
  new Promise((resolve, reject) => {
    console.log(`[Cron] Starting ${label}...`);
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...extraEnv },
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[Cron] ${label} completed.`);
        resolve();
      } else {
        reject(new Error(`${label} exited with code ${code}`));
      }
    });
  });

const runHourlyCycle = async () => {
  console.log(`\n[Cron] Hourly cycle started at ${new Date().toISOString()}`);
  await runCommand('Discover Jobs', 'npm', ['run', 'jobs:discover']);
  await runCommand('Apply From Dashboard Settings', 'npm', ['run', 'jobs:apply:filtered']);
  await runCommand('Retry Failed', 'npm', ['run', 'jobs:retry-failed']);
  await runCommand('Analyze Failures', 'npm', ['run', 'jobs:analyze-failures']);
  await runCommand('Status', 'npm', ['run', 'jobs:status']);
  console.log(`[Cron] Hourly cycle finished at ${new Date().toISOString()}`);
};

module.exports = { runHourlyCycle };