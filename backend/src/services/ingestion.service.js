const { retryWithBackoff } = require('../utils/retry');
const { getBreaker } = require('../utils/circuit-breaker');
const { generateContentHash } = require('../utils/hash');
const { normalizeString, normalizeUrl } = require('../utils/normalize');
const jobRepository = require('../repositories/job.repository');
const sourceRepository = require('../repositories/source.repository');
const ingestionRepository = require('../repositories/ingestion.repository');
const AdzunaJobSource = require('../sources/AdzunaJobSource');
const { externalJobSchema } = require('../models/external-job.model');
const logger = require('../utils/logger');

class IngestionService {
  constructor() {
    this.adapters = {
      adzuna: new AdzunaJobSource()
    };
    // Concurrent run protection lock
    this.isIngesting = false;
  }

  /**
   * Retrieves registered source adapter by name.
   * @param {string} sourceName 
   * @returns {JobSource|undefined}
   */
  getAdapter(sourceName) {
    return this.adapters[sourceName.toLowerCase()];
  }

  /**
   * Runs the ingestion pipeline for a specific job source.
   * Includes circuit breaker, retry strategies, and primary + secondary deduplication.
   * @param {string} sourceName 
   * @param {Object} options - Filtering options (limit, category, search)
   * @returns {Promise<Object>} Ingestion run stats
   */
  async runIngestion(sourceName, options = {}) {
    // 1. Prevent concurrent runs
    if (this.isIngesting) {
      const errorMsg = 'Another ingestion run is currently in progress. Please try again later.';
      logger.warn(`Ingestion request rejected: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const adapter = this.getAdapter(sourceName);
    if (!adapter) {
      throw new Error(`Unsupported job source: ${sourceName}`);
    }

    this.isIngesting = true;
    const name = adapter.getSourceName();
    const breaker = getBreaker(name);

    logger.info(`Starting ingestion run for source: ${name}...`);

    try {
      // Ensure source metadata exists in database
      const baseUrl = 'https://api.adzuna.com/v1/api';

      await sourceRepository.upsert(name, {
        baseUrl,
        enabled: true
      });

      // Create a RUNNING state log for the run
      const runLog = await ingestionRepository.create({
        source: name,
        status: 'RUNNING',
        startedAt: new Date()
      });

      const startTime = Date.now();
      let jobsFetched = 0;
      let jobsInserted = 0;
      let jobsUpdated = 0;
      let jobsSkipped = 0;

      try {
        let normalizedJobs = [];

        // Execute raw fetch inside circuit breaker & exponential retry
        const rawJobs = await breaker.execute(
          async () => {
            return await retryWithBackoff(async () => {
              return await adapter.fetchJobs(options);
            }, 3, 500, 2);
          },
          async () => {
            logger.warn(`Fallback triggered for source ${name}. Existing jobs remain available.`);
            throw new Error(`Circuit Breaker is OPEN for ${name} or request failed.`);
          }
        );

        jobsFetched = rawJobs.length;

        // Convert raw Adzuna jobs into the unified internal Job model
        for (const r of rawJobs) {
          const mapped = {
            externalId: String(r.id),
            source: 'adzuna',
            title: r.title || 'Untitled Job',
            companyName: (r.company && r.company.display_name) || 'Unknown Company',
            location: (r.location && r.location.display_name) || 'Remote',
            jobType: r.contract_type || 'full-time',
            category: (r.category && r.category.label) || 'Other',
            description: r.description || '',
            url: r.redirect_url || '',
            publishedAt: r.created ? new Date(r.created) : new Date(),
            sourceCreatedAt: r.created ? new Date(r.created) : new Date()
          };

          const validation = externalJobSchema.safeParse(mapped);
          if (validation.success) {
            normalizedJobs.push(validation.data);
          } else {
            logger.warn(`Skipped Adzuna job ${r.id} due to validation error: ${JSON.stringify(validation.error.format())}`);
          }
        }

        logger.info(`Source ${name} returned ${jobsFetched} fetch results. Running deduplication on ${normalizedJobs.length} normalized records...`);

        for (const newJob of normalizedJobs) {
          // Calculate content hash (deterministic)
          const contentHash = generateContentHash(newJob);
          const newJobWithHash = { ...newJob, contentHash };

          // 1. Primary deduplication check (externalId + source)
          const primaryDuplicate = await jobRepository.findByExternalIdAndSource(newJob.externalId, name);

          if (primaryDuplicate) {
            if (primaryDuplicate.contentHash === contentHash) {
              jobsSkipped++;
            } else {
              // Hash changed, update the job details
              await jobRepository.update(primaryDuplicate.id, newJobWithHash);
              jobsUpdated++;
            }
            continue;
          }

          // 2. Secondary deduplication check (companyName + title + url)
          const companyJobs = await jobRepository.findByCompany(newJob.companyName);
          let secondaryMatch = false;

          const normalizedNewTitle = normalizeString(newJob.title);
          const normalizedNewUrl = normalizeUrl(newJob.url);

          for (const existingJob of companyJobs) {
            const normalizedExistingTitle = normalizeString(existingJob.title);
            const normalizedExistingUrl = normalizeUrl(existingJob.url);

            if (normalizedExistingTitle === normalizedNewTitle && normalizedExistingUrl === normalizedNewUrl) {
              secondaryMatch = true;
              break;
            }
          }

          if (secondaryMatch) {
            jobsSkipped++;
            continue;
          }

          // 3. No duplicates found, insert job
          await jobRepository.create(newJobWithHash);
          jobsInserted++;
        }

        const durationMs = Date.now() - startTime;
        
        // Update run log with successful execution metrics
        await ingestionRepository.update(runLog.id, {
          status: 'SUCCESS',
          completedAt: new Date(),
          jobsFetched,
          jobsInserted,
          jobsUpdated,
          jobsSkipped,
          durationMs
        });

        // Update source health and successful timestamps
        await sourceRepository.updateStats(name, {
          status: 'HEALTHY',
          totalFetched: jobsFetched,
          totalInserted: jobsInserted,
          totalUpdated: jobsUpdated,
          isSuccess: true
        });

        logger.info(`Finished ingestion for ${name}: Fetched=${jobsFetched}, Inserted=${jobsInserted}, Updated=${jobsUpdated}, Skipped=${jobsSkipped} in ${durationMs}ms`);

        return {
          status: 'SUCCESS',
          jobsFetched,
          jobsInserted,
          jobsUpdated,
          jobsSkipped,
          durationMs
        };
      } catch (error) {
        const durationMs = Date.now() - startTime;
        logger.error(`Ingestion failed for source ${name}: ${error.message}`);

        // Update run log with error and stats
        await ingestionRepository.update(runLog.id, {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
          durationMs
        });

        // Update source status to DEGRADED on failures
        await sourceRepository.updateStats(name, {
          status: 'DEGRADED',
          isSuccess: false
        });

        throw error;
      }
    } finally {
      this.isIngesting = false;
    }
  }
}

module.exports = new IngestionService();
