try {
  const express = require('express');
  const path = require('path');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  require('dotenv').config();

  const app = express();
  // Render (and most PaaS) inject PORT; bind 0.0.0.0 so health checks see an open port.
  const PORT = Number(process.env.PORT) || 5000;
  const HOST = process.env.HOST || '0.0.0.0';

  // Middleware
  app.use(express.json());
  app.use(cors());
  app.use(helmet({
    crossOriginResourcePolicy: false, // Allow images to be loaded
  }));
  app.use(morgan('dev'));
  
  // Static folder for screenshots
  app.use('/screenshots', express.static(path.join(__dirname, 'public/screenshots')));

  // Routes
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/jobs', require('./routes/jobRoutes'));
  app.use('/api/applications', require('./routes/applicationRoutes'));
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

  // Database Connection
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
