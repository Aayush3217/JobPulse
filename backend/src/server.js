const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/database');
const cron = require('node-cron');
const ingestionService = require('./services/ingestion.service');
const logger = require('./utils/logger');

const PORT = env.PORT || 5000;

async function startServer() {
  // 1. Establish database connection
  await connectDb();

  // 2. Start Express app listening
  const server = app.listen(PORT, () => {
    logger.info(`🚀 JobPulse Server running in [${env.NODE_ENV}] mode on port ${PORT}`);
  });

  // 3. Setup scheduled cron job
  if (env.INGESTION_CRON && env.NODE_ENV !== 'test') {
    if (cron.validate(env.INGESTION_CRON)) {
      logger.info(`⏰ Scheduled job ingestion configured with cron pattern: "${env.INGESTION_CRON}"`);
      cron.schedule(env.INGESTION_CRON, async () => {
        logger.info('⏰ Cron triggered: executing auto job ingestion for remotive...');
        try {
          await ingestionService.runIngestion('remotive');
        } catch (err) {
          logger.error(`❌ Cron scheduled ingestion failed: ${err.message}`);
        }
      });
    } else {
      logger.error(`❌ Invalid INGESTION_CRON pattern: "${env.INGESTION_CRON}". Scheduling skipped.`);
    }
  }

  // Graceful shutdown
  const handleShutdown = () => {
    logger.info('Received shutdown signal. Closing server...');
    server.close(() => {
      logger.info('Server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer().catch((error) => {
  logger.error('Fatal server startup error:', error);
  process.exit(1);
});
