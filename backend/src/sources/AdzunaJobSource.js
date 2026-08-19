const JobSource = require('./JobSource');
const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

class AdzunaJobSource extends JobSource {
  /**
   * Returns the unique source name.
   * @returns {string}
   */
  getSourceName() {
    return 'adzuna';
  }

  /**
   * Fetches raw job listings from the Adzuna Jobs Search API.
   * Supports: country, page, keyword (what), location (where), results_per_page.
   * @param {Object} options 
   * @returns {Promise<Array<Object>>} List of raw external jobs
   */
  async fetchJobs(options = {}) {
    const country = (options.country || 'in').toLowerCase();
    const page = options.page || 1;
    
    // Load app credentials
    const app_id = env.ADZUNA_APP_ID;
    const app_key = env.ADZUNA_APP_KEY;

    if (!app_id || !app_key) {
      throw new Error('Adzuna API credentials (ADZUNA_APP_ID/ADZUNA_APP_KEY) are missing in environment.');
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
    const timeout = 10000; // 10 seconds

    logger.info(`Fetching jobs from Adzuna API URL: ${url}...`);

    const params = {
      app_id,
      app_key,
      'content-type': 'application/json'
    };

    if (options.keyword) {
      params.what = options.keyword;
    }
    if (options.location) {
      params.where = options.location;
    }
    if (options.results_per_page) {
      params.results_per_page = options.results_per_page;
    } else {
      params.results_per_page = 15; // default results per page
    }

    try {
      const response = await axios.get(url, {
        params,
        timeout,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.data || !Array.isArray(response.data.results)) {
        throw new Error('Invalid response structure from Adzuna API: missing "results" array');
      }

      const rawJobs = response.data.results;
      logger.info(`Successfully fetched ${rawJobs.length} raw jobs from Adzuna API.`);

      return rawJobs;
    } catch (error) {
      logger.error(`Error communicating with Adzuna API: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AdzunaJobSource;
