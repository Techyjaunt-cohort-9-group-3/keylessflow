const app = require('./app');
const { port, nodeEnv } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { startBookingJobs, runBookingJobs } = require('./jobs/booking.jobs');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`KeylessFlow API running in ${nodeEnv} mode on http://localhost:${port}/api/v1`);
  });

  // Expire unpaid holds and send booking reminders in the background
  runBookingJobs();
  const jobsTimer = startBookingJobs();

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    clearInterval(jobsTimer);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force exit if connections don't close in time
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

start();
