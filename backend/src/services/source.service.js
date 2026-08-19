const sourceRepository = require('../repositories/source.repository');
const { getBreaker } = require('../utils/circuit-breaker');

class SourceService {
  /**
   * Retrieves all registered sources from database.
   * @returns {Promise<Array<Object>>}
   */
  async getSources() {
    return sourceRepository.getAll();
  }

  /**
   * Retrieves detailed health metrics for a source (combining database fields + active circuit breaker state).
   * @param {string} sourceName 
   * @returns {Promise<Object>} health report
   */
  async getSourceHealth(sourceName) {
    const name = sourceName.toLowerCase();
    const source = await sourceRepository.findByName(name);
    if (!source) {
      throw new Error(`Source not found: ${sourceName}`);
    }

    const breaker = getBreaker(name);

    return {
      source: source.name,
      status: source.lastStatus || 'UNKNOWN',
      circuitBreakerState: breaker.getState(),
      lastSuccessfulRun: source.lastSuccessfulRun,
      lastFailedRun: source.lastFailedRun,
      totalJobsFetched: source.totalJobsFetched,
      totalJobsInserted: source.totalJobsInserted,
      totalJobsUpdated: source.totalJobsUpdated
    };
  }
}

module.exports = new SourceService();
