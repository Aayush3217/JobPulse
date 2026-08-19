const request = require('supertest');
const app = require('../src/app');
const jobService = require('../src/services/job.service');
const healthService = require('../src/services/health.service');

// Mock services
jest.mock('../src/services/job.service');
jest.mock('../src/services/health.service');

describe('API Route & Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      healthService.checkHealth.mockResolvedValue({
        status: 'UP',
        database: 'UP',
        timestamp: '2026-08-18'
      });

      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ status: 'UP', database: 'UP' }));
    });
  });

  describe('GET /api/jobs', () => {
    test('should return jobs with default query parameters', async () => {
      jobService.getJobs.mockResolvedValue({
        jobs: [{ id: '1', title: 'Developer' }],
        total: 1
      });

      const res = await request(app).get('/api/jobs');
      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data).toHaveLength(1);
      expect(jobService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: 20, sort: 'publishedAt_desc' })
      );
    });

    test('should validate and parse query parameters correctly', async () => {
      jobService.getJobs.mockResolvedValue({ jobs: [], total: 0 });

      const res = await request(app).get('/api/jobs?page=2&size=50&keyword=javascript');
      expect(res.status).toBe(200);
      expect(jobService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, size: 50, keyword: 'javascript' })
      );
    });

    test('should reject query with size exceeding 100', async () => {
      const res = await request(app).get('/api/jobs?size=150');
      expect(res.status).toBe(400); // Validation error
      expect(res.body.error).toBe('Invalid query parameters');
    });

    test('should reject query with negative page', async () => {
      const res = await request(app).get('/api/jobs?page=-1');
      expect(res.status).toBe(400);
    });
  });
});
