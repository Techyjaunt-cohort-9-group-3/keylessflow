const mongoose = require('mongoose');
const { mongoUri, dbName } = require('./env');

mongoose.connection.on('connected', () => {
  const { host, port, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}:${port}/${name}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

async function connectDB() {
  // dbName forces the "keylessflow" database even if the URI names another one
  await mongoose.connect(mongoUri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  });
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.connection.close();
}

module.exports = { connectDB, disconnectDB };
