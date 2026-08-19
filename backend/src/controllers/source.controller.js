const sourceService = require('../services/source.service');

class SourceController {
  /**
   * GET /api/sources
   * Lists all available job sources.
   */
  async getSources(req, res, next) {
    try {
      const sources = await sourceService.getSources();
      res.json(sources);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sources/:source/health
   * Retrieves active health status and circuit breaker information for a source.
   */
  async getSourceHealth(req, res, next) {
    try {
      const { source } = req.params;
      if (!source) {
        return res.status(400).json({ error: 'Source name parameter is required' });
      }

      const health = await sourceService.getSourceHealth(source);
      res.json(health);
    } catch (error) {
      if (error.message.includes('Source not found')) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new SourceController();
