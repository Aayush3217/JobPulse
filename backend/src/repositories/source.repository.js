const { prisma } = require('../config/database');

class SourceRepository {
  /**
   * Find a source by its name.
   * @param {string} name 
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    return prisma.jobSource.findUnique({
      where: { name }
    });
  }

  /**
   * Get all registered job sources.
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    return prisma.jobSource.findMany();
  }

  /**
   * Upsert a source configuration.
   * @param {string} name 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async upsert(name, data) {
    return prisma.jobSource.upsert({
      where: { name },
      update: data,
      create: {
        name,
        baseUrl: data.baseUrl || '',
        ...data
      }
    });
  }

  /**
   * Update stats and last execution timestamps for a source.
   * @param {string} name 
   * @param {Object} stats 
   * @returns {Promise<Object>}
   */
  async updateStats(name, { status, totalFetched = 0, totalInserted = 0, totalUpdated = 0, isSuccess = true }) {
    const source = await this.findByName(name);
    const updates = {
      lastStatus: status,
      totalJobsFetched: (source?.totalJobsFetched || 0) + totalFetched,
      totalJobsInserted: (source?.totalJobsInserted || 0) + totalInserted,
      totalJobsUpdated: (source?.totalJobsUpdated || 0) + totalUpdated
    };

    if (isSuccess) {
      updates.lastSuccessfulRun = new Date();
    } else {
      updates.lastFailedRun = new Date();
    }

    return prisma.jobSource.update({
      where: { name },
      data: updates
    });
  }
}

module.exports = new SourceRepository();
