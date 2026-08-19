const logger = require('./logger');

class CircuitBreaker {
  /**
   * Initialize circuit breaker for a source.
   * @param {string} name - Source name
   * @param {Object} options - Thresholds
   */
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownPeriod = options.cooldownPeriod || 60000; // 1 minute in ms
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Returns current state, accounting for cooldown timeout transition.
   * @returns {string}
   */
  getState() {
    this.checkCooldown();
    return this.state;
  }

  /**
   * Transitions state from OPEN to HALF_OPEN if cooldown has expired.
   */
  checkCooldown() {
    if (this.state === 'OPEN' && this.lastFailureTime) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.cooldownPeriod) {
        this.state = 'HALF_OPEN';
        logger.info(`🔌 Circuit Breaker [${this.name}] transitioned to HALF_OPEN (cooldown expired).`);
      }
    }
  }

  /**
   * Reset breaker state on successful request.
   */
  recordSuccess() {
    if (this.state === 'HALF_OPEN' || this.state === 'OPEN') {
      logger.info(`🔌 Circuit Breaker [${this.name}] transitioned to CLOSED (request succeeded).`);
    }
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Record a failure and transition breaker state if threshold exceeded.
   */
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    logger.warn(`🔌 Circuit Breaker [${this.name}] recorded failure #${this.failureCount} in state ${this.state}.`);

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error(`🔌 Circuit Breaker [${this.name}] transitioned to OPEN. Failures: ${this.failureCount}.`);
    }
  }

  /**
   * Executes target action wrapped in circuit breaker logic.
   * @param {Function} fn - Async operation
   * @param {Function} fallbackFn - Fallback operation if open or failed
   */
  async execute(fn, fallbackFn) {
    this.checkCooldown();

    if (this.state === 'OPEN') {
      logger.warn(`🔌 Circuit Breaker [${this.name}] is OPEN. Executing fallback.`);
      if (fallbackFn) return fallbackFn();
      throw new Error(`Circuit breaker is OPEN for source ${this.name}`);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      if (fallbackFn) {
        logger.warn(`🔌 Request failed. Executing fallback. Error: ${err.message}`);
        return fallbackFn();
      }
      throw err;
    }
  }
}

// In-memory registry for breakers per source
const breakers = {};

/**
 * Retrieves or registers a circuit breaker for a source name.
 * @param {string} name 
 * @param {Object} options 
 * @returns {CircuitBreaker}
 */
function getBreaker(name, options) {
  if (!breakers[name]) {
    breakers[name] = new CircuitBreaker(name, options);
  }
  return breakers[name];
}

module.exports = {
  CircuitBreaker,
  getBreaker
};
