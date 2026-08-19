const { PrismaClient } = require('@prisma/client');
const env = require('./env');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error', 'warn']
});

// Test database connectivity
async function connectDb() {
  try {
    await prisma.$connect();
    logger.info('🔌 Database connection has been established successfully.');
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

module.exports = {
  prisma,
  connectDb
};
