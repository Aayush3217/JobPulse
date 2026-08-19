const { prisma } = require('../config/database');

class IngestionRepository {
  /**
   * Find an ingestion run by ID.
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.ingestionRun.findUnique({
      where: { id }
    });
  }

  /**
   * Create an ingestion run log.
   * @param {Object} runData 
   * @returns {Promise<Object>}
   */
  async create(runData) {
    return prisma.ingestionRun.create({
      data: runData
    });
  }

  /**
   * Update an ingestion run log (e.g. completion status and metrics).
   * @param {string} id 
   * @param {Object} runData 
   * @returns {Promise<Object>}
   */
  async update(id, runData) {
    return prisma.ingestionRun.update({
      where: { id },
      data: runData
    });
  }

  /**
   * Retrieve recent ingestion runs.
   * @param {number} limit 
   * @returns {Promise<Array<Object>>}
   */
  async findAll(limit = 50) {
    return prisma.ingestionRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit
    });
  }
}

module.exports = new IngestionRepository();
