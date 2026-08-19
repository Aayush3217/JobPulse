const jobService = require('../services/job.service');
const { getJobsQuerySchema, getJobByIdParamsSchema } = require('../validators/job.validator');

class JobController {
  /**
   * GET /api/jobs
   * Retrieves paginated, sorted, and filtered list of job listings.
   */
  async getJobs(req, res, next) {
    try {
      const parsed = getJobsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: 'Invalid query parameters', 
          details: parsed.error.format() 
        });
      }

      const result = await jobService.getJobs(parsed.data);
      const { jobs, total } = result;
      const totalPages = Math.ceil(total / parsed.data.size);
      
      res.json({
        data: jobs,
        pagination: {
          page: parsed.data.page,
          size: parsed.data.size,
          total,
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jobs/:id
   * Retrieves details for a specific job listing by ID.
   */
  async getJobById(req, res, next) {
    try {
      const parsed = getJobByIdParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: 'Invalid route parameters', 
          details: parsed.error.format() 
        });
      }

      const job = await jobService.getJobById(parsed.data.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(job);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController();
