const { normalizeString, normalizeUrl } = require('../src/utils/normalize');
const { generateContentHash } = require('../src/utils/hash');
const { retryWithBackoff } = require('../src/utils/retry');
const { CircuitBreaker } = require('../src/utils/circuit-breaker');

describe('Utilities Tests', () => {
  describe('Normalization', () => {
    test('normalizeString should remove non-alphanumeric, spaces, and lowercase', () => {
      expect(normalizeString('  Senior Software  Engineer! ')).toBe('seniorsoftwareengineer');
      expect(normalizeString('Google Inc.')).toBe('googleinc');
    });

    test('normalizeUrl should strip queries, hashes, and slashes', () => {
      expect(normalizeUrl('https://remotive.com/jobs/123?utm_source=feed#section')).toBe('remotive.com/jobs/123');
      expect(normalizeUrl('http://www.google.com/')).toBe('www.google.com');
    });
  });

  describe('Content Hashing', () => {
    test('generateContentHash should be deterministic', () => {
      const job1 = {
        title: 'Developer',
        companyName: 'A.Team',
        location: 'Remote',
        jobType: 'contract',
        url: 'https://a.team/dev',
        description: '<p>Some description</p>'
      };
      const job2 = { ...job1 };
      
      const hash1 = generateContentHash(job1);
      const hash2 = generateContentHash(job2);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex is 64 characters
    });
  });

  describe('Retry Behavior', () => {
    test('retryWithBackoff should resolve on success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(mockFn, 3, 10, 2);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('retryWithBackoff should retry up to maxAttempts and then throw', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      await expect(retryWithBackoff(mockFn, 3, 10, 2)).rejects.toThrow('failure');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('retryWithBackoff should fail immediately on permanent HTTP 4xx errors', async () => {
      const error = new Error('Not Found');
      error.response = { status: 404 };
      const mockFn = jest.fn().mockRejectedValue(error);
      
      await expect(retryWithBackoff(mockFn, 3, 10, 2)).rejects.toThrow('Not Found');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Breaker', () => {
    test('Should transition from CLOSED to OPEN after failure threshold met', async () => {
      const cb = new CircuitBreaker('test-source', { failureThreshold: 2, cooldownPeriod: 100 });
      expect(cb.getState()).toBe('CLOSED');

      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      // First run
      await expect(cb.execute(mockFn)).rejects.toThrow('fail');
      expect(cb.getState()).toBe('CLOSED');

      // Second run -> exceeds threshold (2) -> transitions to OPEN
      await expect(cb.execute(mockFn)).rejects.toThrow('fail');
      expect(cb.getState()).toBe('OPEN');

      // Subsequent runs should fail fast
      await expect(cb.execute(() => Promise.resolve('ok'))).rejects.toThrow('Circuit breaker is OPEN');
    });
  });
});
