const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { errorResponse } = require('./utils/apiResponse');
const apiRoutes = require('./routes');

const app = express();

// Security HTTP headers (cross-origin resource policy configured for cross-origin frontend-backend deployment)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Normalize configured allowed origins
const parseAllowedOrigins = () => {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
  ];

  if (config.frontendUrl) {
    config.frontendUrl.split(',').forEach((url) => {
      const trimmed = url.trim().replace(/\/+$/, '');
      if (trimmed && !defaults.includes(trimmed)) {
        defaults.push(trimmed);
      }
    });
  }

  return defaults;
};

const allowedOriginsList = parseAllowedOrigins();

// Robust CORS configuration supporting Vercel, Render, Localhost, and custom domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman, health checks)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // 1. Allow any local development origin
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // 2. Automatically allow any Vercel deployment (*.vercel.app)
    if (/^https:\/\/[a-zA-Z0-9._-]+\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // 3. Automatically allow any Render domain (*.onrender.com)
    if (/^https:\/\/[a-zA-Z0-9._-]+\.onrender\.com$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // 4. Match against configured FRONTEND_URL list
    if (allowedOriginsList.includes(cleanOrigin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// HTTP Request Logger
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'PeoplePay360 HR & Payroll Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'Active'
  });
});

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
