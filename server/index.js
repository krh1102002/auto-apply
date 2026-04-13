console.log('--- ENTERING INDEX.JS ---');
try {
  const express = require('express');
  console.log('✅ EX1');
  const path = require('path');
  console.log('✅ EX2');
  const mongoose = require('mongoose');
  console.log('✅ EX3');
  const cors = require('cors');
  console.log('✅ EX4');
  const helmet = require('helmet');
  console.log('✅ EX5');
  const morgan = require('morgan');
  console.log('✅ EX6');
  require('dotenv').config();
  console.log('✅ EX7');

  const app = express();
  const PORT = Number(process.env.PORT) || 5000;
  const HOST = process.env.HOST || '0.0.0.0';

  // Middleware
  app.use(express.json());
  app.use(cors());
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(morgan('dev'));
  
  app.use('/screenshots', express.static(path.join(__dirname, 'public/screenshots')));

  // Routes
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/jobs', require('./routes/jobRoutes'));
  app.use('/api/cron', require('./routes/cronRoutes'));

  app.get('/', (req, res) => {
    res.json({ message: 'Job Application Automation API is running' });
  });

  app.get('/api/health', (req, res) => {
    const dbStateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const dbStateCode = mongoose.connection.readyState;
    const dbState = dbStateMap[dbStateCode] || 'unknown';
    const isHealthy = dbState === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      service: 'job-apply-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        state: dbState,
        code: dbStateCode
      },
      cron: {
        httpTriggerConfigured: Boolean(process.env.CRON_SECRET),
      },
    });
  });

  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
  });
} catch (err) {
  console.error('SERVER INITIALIZATION ERROR:');
  console.error(err.stack);
  process.exit(1);
}
