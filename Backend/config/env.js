require('dotenv').config({ quiet: true });

const required = ['MONGO_URI'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME || 'keylessflow',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
