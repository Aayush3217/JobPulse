const crypto = require('crypto');

/**
 * Generates a SHA-256 hash based on key job fields
 * @param {Object} job 
 * @returns {string} SHA-256 hash
 */
function generateContentHash(job) {
  const contentString = [
    (job.title || '').trim().toLowerCase(),
    (job.companyName || '').trim().toLowerCase(),
    (job.location || '').trim().toLowerCase(),
    (job.jobType || '').trim().toLowerCase(),
    (job.url || '').trim().toLowerCase(),
    (job.description || '').trim()
  ].join('|');

  return crypto.createHash('sha256').update(contentString).digest('hex');
}

module.exports = {
  generateContentHash
};
