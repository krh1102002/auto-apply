/**
 * External cron trigger (GitHub Actions, cron-job.org, etc.) — avoids Render's paid Cron service.
 * Set CRON_SECRET in Render env and call POST /api/cron/hourly with that secret.
 */
const express = require('express');
const { runHourlyCycle } = require('../hourlyCycle');

const router = express.Router();

let hourlyRunning = false;

router.post('/hourly', (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({
      ok: false,
      error: 'CRON_SECRET is not configured',
    });
  }

  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  const headerSecret = req.headers['x-cron-secret'];

  if (bearer !== secret && headerSecret !== secret) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (hourlyRunning) {
    return res.status(409).json({
      ok: false,
      message: 'Hourly cycle already running',
    });
  }

  hourlyRunning = true;

  res.status(202).json({
    ok: true,
    message: 'Hourly cycle started in background',
    startedAt: new Date().toISOString(),
  });

  console.log('[HTTP Cron] Hourly cycle started (POST /api/cron/hourly)');

  runHourlyCycle()
    .then(() => console.log('[HTTP Cron] Hourly cycle completed'))
    .catch((err) => console.error('[HTTP Cron] Hourly cycle failed:', err.message))
    .finally(() => {
      hourlyRunning = false;
    });
});

module.exports = router;
