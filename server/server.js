const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

let server;

const startServer = async () => {
  try {
    // 1. Connect to Database
    logger.info('Initializing MongoDB connection...');
    await connectDB();

    // 2. Start HTTP server
    server = http.createServer(app);
    server.listen(config.port, () => {
      logger.info(`================================================`);
      logger.info(` PeoplePay360 Server running in [${config.env}] mode`);
      logger.info(` Server Listening on: http://localhost:${config.port}`);
      logger.info(` API Health Check:   http://localhost:${config.port}/api/health`);
      logger.info(` Allowed Frontend:   ${config.frontendUrl}`);
      logger.info(`================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed. Terminating database connection...');
      await disconnectDB();
      logger.info('PeoplePay360 server shutdown completed. Exiting.');
      process.exit(0);
    });

    // Force shutdown after 10s if connections fail to close
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', err);
  gracefulShutdown('uncaughtException');
});

// Start the server
startServer();
