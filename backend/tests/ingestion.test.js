const IngestionService = require('../src/services/ingestion.service');
const jobRepository = require('../src/repositories/job.repository');
const sourceRepository = require('../src/repositories/source.repository');
const ingestionRepository = require('../src/repositories/ingestion.repository');
const AdzunaJobSource = require('../src/sources/AdzunaJobSource');

// Mock components
jest.mock('../src/repositories/job.repository');
jest.mock('../src/repositories/source.repository');
jest.mock('../src/repositories/ingestion.repository');
jest.mock('../src/sources/AdzunaJobSource');

describe('Ingestion Service Ingestion & Deduplication Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('runIngestion should run successfully, resolving inserts, updates, and skips for Adzuna', async () => {
    const mockRawJobs = [
      {
        id: 'adzuna-1',
        title: 'React Dev',
        company: { display_name: 'Tech Corp' },
        location: { display_name: 'Delhi' },
        contract_type: 'full-time',
        category: { label: 'IT Jobs' },
        description: 'React description',
        redirect_url: 'https://adzuna.com/job/1',
        created: '2026-08-16T12:00:00Z'
      },
      {
        id: 'adzuna-2',
        title: 'Node Dev',
        company: { display_name: 'Tech Corp B' },
        location: { display_name: 'Mumbai' },
        contract_type: 'full-time',
        category: { label: 'IT Jobs' },
        description: 'Node description',
        redirect_url: 'https://adzuna.com/job/2',
        created: '2026-08-16T12:00:00Z'
      },
      {
        id: 'adzuna-3',
        title: 'Vue Dev',
        company: { display_name: 'Tech Corp C' },
        location: { display_name: 'Delhi' },
        contract_type: 'contract',
        category: { label: 'IT Jobs' },
        description: 'Vue description updated',
        redirect_url: 'https://adzuna.com/job/3',
        created: '2026-08-16T12:00:00Z'
      },
      {
        id: 'adzuna-4',
        title: 'Angular Dev',
        company: { display_name: 'Tech Corp D' },
        location: { display_name: 'Delhi' },
        contract_type: 'full-time',
        category: { label: 'IT Jobs' },
        description: 'Angular description',
        redirect_url: 'https://adzuna.com/job/4',
        created: '2026-08-16T12:00:00Z'
      }
    ];

    // Mock adapter fetch
    AdzunaJobSource.prototype.getSourceName.mockReturnValue('adzuna');
    AdzunaJobSource.prototype.fetchJobs.mockResolvedValue(mockRawJobs);

    // Mock database upserts & logs
    sourceRepository.upsert.mockResolvedValue({});
    ingestionRepository.create.mockResolvedValue({ id: 'run-123' });
    ingestionRepository.update.mockResolvedValue({});
    sourceRepository.updateStats.mockResolvedValue({});

    // Mock Repository Checks:
    // Job 1 & 2: Brand new -> INSERT
    jobRepository.findByExternalIdAndSource.mockImplementation((extId, src) => {
      if (extId === 'adzuna-3') {
        // Job 3: Primary duplicate with old hash -> UPDATE
        return Promise.resolve({
          id: 'job-3',
          externalId: 'adzuna-3',
          source: 'adzuna',
          contentHash: 'different-hash-value'
        });
      }
      return Promise.resolve(null);
    });

    // Job 4: Secondary Duplicate search -> company has another job matching title & url
    jobRepository.findByCompany.mockImplementation((companyName) => {
      if (companyName === 'Tech Corp D') {
        return Promise.resolve([
          {
            id: 'job-d-old',
            title: 'Angular Dev',
            companyName: 'Tech Corp D',
            url: 'https://adzuna.com/job/4'
          }
        ]);
      }
      return Promise.resolve([]);
    });

    // Execute
    const stats = await IngestionService.runIngestion('adzuna');

    expect(stats.status).toBe('SUCCESS');
    expect(stats.jobsFetched).toBe(4);
    
    // Inserts: Job 1, Job 2 -> 2
    expect(stats.jobsInserted).toBe(2);
    expect(jobRepository.create).toHaveBeenCalledTimes(2);

    // Updates: Job 3 -> 1
    expect(stats.jobsUpdated).toBe(1);
    expect(jobRepository.update).toHaveBeenCalledTimes(1);

    // Skips: Job 4 -> 1
    expect(stats.jobsSkipped).toBe(1);

    // IngestionRun completion updated
    expect(ingestionRepository.update).toHaveBeenCalledWith(
      'run-123',
      expect.objectContaining({ status: 'SUCCESS' })
    );
  });
});
