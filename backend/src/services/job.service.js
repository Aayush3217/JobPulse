const jobRepository = require('../repositories/job.repository');

const ingestionService = require('./ingestion.service');
const logger = require('../utils/logger');

class JobService {
  /**
   * Retrieves a paginated list of jobs filtered by queries.
   * If database is completely empty, triggers automatic background ingestion.
   * @param {Object} filters 
   * @returns {Promise<Object>} Object with list of matches and pagination count
   */
  async getJobs(filters) {
    const result = await jobRepository.findAll(filters);
    
    // Auto-fetch if no query params are present and database has 0 listings
    if (result.total === 0 && !filters.keyword && !filters.location && !filters.category && !filters.jobType && !filters.source) {
      const totalInDb = await jobRepository.count({});
      if (totalInDb === 0) {
        logger.info('Database is empty. Triggering automatic background ingestion for Adzuna...');
        ingestionService.runIngestion('adzuna').catch((err) => {
          logger.error(`Automatic background ingestion failed: ${err.message}`);
        });
      }
    }
    
    return result;
  }

  /**
   * Retrieves a single job by ID.
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async getJobById(id) {
    return jobRepository.findById(id);
  }
}

module.exports = new JobService();
