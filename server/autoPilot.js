require('dotenv').config({ path: './.env' });
const { spawn } = require('child_process');

const CYCLE_MINUTES = Number(process.env.AUTOPILOT_CYCLE_MINUTES || 30);

const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
      shell: true
    });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`))));
  });

const runCycle = async () => {
  console.log(`\n[AutoPilot] Cycle started at ${new Date().toISOString()}`);
  await runCommand('npm', ['run', 'jobs:discover']);
  await runCommand('npm', ['run', 'jobs:apply:mass']);
  await runCommand('npm', ['run', 'jobs:status']);
  console.log(`[AutoPilot] Cycle finished at ${new Date().toISOString()}`);
};

const start = async () => {
  try {
    await runCycle();
  } catch (err) {
    console.error('[AutoPilot] Initial cycle error:', err.message);
  }

  setInterval(async () => {
    try {
      await runCycle();
    } catch (err) {
      console.error('[AutoPilot] Scheduled cycle error:', err.message);
    }
  }, CYCLE_MINUTES * 60 * 1000);

  console.log(`[AutoPilot] Running every ${CYCLE_MINUTES} minutes.`);
};

start();
