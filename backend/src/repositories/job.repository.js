const { prisma } = require('../config/database');

class JobRepository {
  /**
   * Find a single job by its ID.
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.job.findUnique({
      where: { id }
    });
  }

  /**
   * Find a job by its unique external ID and source.
   * @param {string} externalId 
   * @param {string} source 
   * @returns {Promise<Object|null>}
   */
  async findByExternalIdAndSource(externalId, source) {
    return prisma.job.findUnique({
      where: {
        externalId_source: {
          externalId,
          source
        }
      }
    });
  }

  /**
   * Find all jobs for a company name.
   * @param {string} companyName 
   * @returns {Promise<Array<Object>>}
   */
  async findByCompany(companyName) {
    return prisma.job.findMany({
      where: {
        companyName: {
          equals: companyName,
          mode: 'insensitive'
        }
      }
    });
  }

  /**
   * Insert a new job into the database.
   * @param {Object} jobData 
   * @returns {Promise<Object>}
   */
  async create(jobData) {
    return prisma.job.create({
      data: jobData
    });
  }

  /**
   * Update an existing job details.
   * @param {string} id 
   * @param {Object} jobData 
   * @returns {Promise<Object>}
   */
  async update(id, jobData) {
    return prisma.job.update({
      where: { id },
      data: jobData
    });
  }

  /**
   * Query matching jobs with filters, sorting, and pagination.
   * @param {Object} params 
   * @returns {Promise<Object>} Object with matches and count
   */
  async findAll({ keyword, location, jobType, category, source, page = 0, size = 20, sort = 'publishedAt_desc' }) {
    const where = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { companyName: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (jobType) {
      where.jobType = { equals: jobType, mode: 'insensitive' };
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (source) {
      where.source = { equals: source, mode: 'insensitive' };
    }

    const orderBy = [];
    if (sort) {
      const [field, direction] = sort.split('_');
      if (field && direction) {
        orderBy.push({ [field]: direction.toLowerCase() });
      }
    } else {
      orderBy.push({ publishedAt: 'desc' });
    }

    const skip = page * size;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy,
        skip,
        take: size
      }),
      prisma.job.count({ where })
    ]);

    return { jobs, total };
  }

  /**
   * Count total number of jobs matching filters.
   * @param {Object} where 
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return prisma.job.count({ where });
  }
}

module.exports = new JobRepository();
