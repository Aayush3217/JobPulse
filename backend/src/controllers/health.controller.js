const healthService = require('../services/health.service');

class HealthController {
  /**
   * GET /api/health
   * Standard endpoint for Docker/hosting health check. Returns 200 if UP, 503 if DOWN.
   */
  async getHealth(req, res, next) {
    try {
      const health = await healthService.checkHealth();
      if (health.status === 'UP') {
        res.status(200).json(health);
      } else {
        res.status(503).json(health);
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HealthController();
