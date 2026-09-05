const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const conn = await mongoose.connect(config.mongoUri, options);
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    console.error(`[MongoDB] Connection URI attempted: ${config.mongoUri}`);
    console.error(`[MongoDB] Tip: Ensure MongoDB is running locally or check your MONGO_URI in server/.env`);
    throw error;
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB] Runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[MongoDB] Connection lost. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[MongoDB] Reconnected successfully.');
  });
};

const disconnectDB = async () => {
  if (isConnected || mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close(false);
      isConnected = false;
      console.log('[MongoDB] Connection closed successfully via graceful shutdown.');
    } catch (err) {
      console.error(`[MongoDB] Error during disconnect: ${err.message}`);
    }
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
