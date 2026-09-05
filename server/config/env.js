const dotenv = require('dotenv');
const path = require('path');

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const requiredEnvVars = ['JWT_SECRET'];

// Check required variables in production
if (process.env.NODE_ENV === 'production') {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/peoplepay360',
  jwtSecret: process.env.JWT_SECRET || 'peoplepay360_fallback_secret_for_dev_only',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production'
};

module.exports = config;
