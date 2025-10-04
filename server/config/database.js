const mongoose = require('mongoose');

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing');

  console.info('🔄 Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.info('✅ Mongo connected');
  return mongoose.connection;
}

async function healthCheck() {
  const conn = mongoose.connection;
  const state = conn.readyState; // 1 = connected
  return {
    status: state === 1 ? 'healthy' : 'unhealthy',
    dbName: conn?.name || null,
    host: conn?.host || null,
  };
}

async function disconnect() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

module.exports = { connect, healthCheck, disconnect };