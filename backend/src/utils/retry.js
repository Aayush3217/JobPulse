const logger = require('./logger');

/**
 * Retry an asynchronous function with exponential backoff
 * @param {Function} fn - The asynchronous function to retry
 * @param {number} maxAttempts - Maximum number of attempts (default 3)
 * @param {number} baseDelayMs - Initial delay in milliseconds (default 500)
 * @param {number} factor - Multiplier for backoff (default 2)
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxAttempts = 3, baseDelayMs = 500, factor = 2) {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts) {
        logger.error(`❌ Operation failed after ${attempt} attempts. Retries exhausted.`);
        throw error;
      }
      
      // Do not retry permanent HTTP errors like 400, 401, 403, 404
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        logger.error(`❌ Permanent error received (${error.response.status}). Aborting retry.`);
        throw error;
      }

      const delay = baseDelayMs * Math.pow(factor, attempt - 1);
      logger.warn(`⚠️ Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  retryWithBackoff
};
