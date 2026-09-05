const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { errorResponse } = require('./utils/apiResponse');
const apiRoutes = require('./routes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching frontend URL
    if (!origin || origin === config.frontendUrl || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

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
