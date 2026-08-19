const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Express centralized error handling middleware.
 * Hides stack traces in production.
 */
function errorHandler(err, req, res, next) {
  logger.error(err, `Error processing request ${req.method} ${req.url}`);

  const status = err.status || 500;
  const response = {
    error: err.message || 'Internal Server Error'
  };

  // Expose stack trace only in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
