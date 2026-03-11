require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Subscription-Based Content API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register a new user',
        'POST /auth/login': 'Login user',
        'POST /auth/upgrade': 'Upgrade to premium subscription'
      },
      content: {
        'GET /content': 'Get all content',
        'GET /content/free': 'Get free content only',
        'GET /content/premium': 'Get premium content (premium only)',
        'GET /content/:id': 'Get specific content',
        'POST /content': 'Create new content (auth required)'
      },
      admin: {
        'GET /admin/logs': 'Get all activity logs (admin only)',
        'GET /admin/logs/premium': 'Get premium access logs (admin only)',
        'GET /admin/stats': 'Get usage statistics (admin only)',
        'GET /admin/users': 'Get all users (admin only)',
        'GET /admin/reports/monthly/:year/:month': 'Generate monthly usage report (admin only)',
        'GET /admin/reports/user/:userId/:year/:month': 'Generate user activity report (admin only)',
        'GET /admin/reports/premium-content/:year/:month': 'Generate premium content report (admin only)',
        'GET /admin/reports/download/:filename': 'Download generated report (admin only)',
        'GET /admin/reports/available': 'List available reports (admin only)'
      }
    }
  });
});

app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/admin', adminRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
