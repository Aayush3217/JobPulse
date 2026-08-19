const rateLimit = require('express-rate-limit');

// General API rate limiter: max 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for manual ingestion runs to prevent DDoS/resource exhaustion
// Limit: max 5 triggers per 15 minutes
const ingestionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many ingestion requests. Manual runs are limited to 5 requests per 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  ingestionLimiter
};
