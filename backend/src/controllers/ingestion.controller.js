const ingestionService = require('../services/ingestion.service');
const ingestionRepository = require('../repositories/ingestion.repository');
const { runIngestionBodySchema, getIngestionRunParamsSchema } = require('../validators/ingestion.validator');

class IngestionController {
  /**
   * POST /api/ingestion/run
   * Triggers a manual job ingestion run for a target source.
   */
  async runIngestion(req, res, next) {
    try {
      const parsed = runIngestionBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: 'Invalid body parameters', 
          details: parsed.error.format() 
        });
      }

      const { source, ...options } = parsed.data;
      const result = await ingestionService.runIngestion(source, options);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Ingestion failed', 
        message: error.message 
      });
    }
  }

  /**
   * GET /api/ingestion/runs
   * Returns a log of all recent ingestion executions.
   */
  async getIngestionRuns(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const runs = await ingestionRepository.findAll(isNaN(limit) ? 50 : limit);
      res.json(runs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ingestion/runs/:id
   * Returns details for a specific ingestion execution by its log ID.
   */
  async getIngestionRunById(req, res, next) {
    try {
      const parsed = getIngestionRunParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: 'Invalid route parameters', 
          details: parsed.error.format() 
        });
      }

      const run = await ingestionRepository.findById(parsed.data.id);
      if (!run) {
        return res.status(404).json({ error: 'Ingestion run not found' });
      }

      res.json(run);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IngestionController();
