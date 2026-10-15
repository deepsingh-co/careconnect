const mongoose = require('mongoose');
const config = require('./index');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(config.db.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    // Don't exit — allow demo mode to work without DB
  }
};

const getConnectionStatus = () => ({
  connected: isConnected,
  state: mongoose.connection.readyState,
  // 0=disconnected 1=connected 2=connecting 3=disconnecting
  label: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
});

module.exports = { connectDB, getConnectionStatus };
