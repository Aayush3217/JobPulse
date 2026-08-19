const { prisma } = require('../config/database');

class HealthService {
  /**
   * Evaluates the health status of the application and its database connection.
   * @returns {Promise<Object>} Status report
   */
  async checkHealth() {
    try {
      // Execute a quick database query to verify connection
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'UP',
        database: 'UP',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'DOWN',
        database: 'DOWN',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new HealthService();
