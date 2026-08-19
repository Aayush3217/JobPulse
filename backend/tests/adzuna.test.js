const axios = require('axios');
const AdzunaJobSource = require('../src/sources/AdzunaJobSource');

const env = require('../src/config/env');

jest.mock('axios');

describe('Adzuna Source Adapter Tests', () => {
  let source;

  beforeEach(() => {
    env.ADZUNA_APP_ID = 'test-app-id';
    env.ADZUNA_APP_KEY = 'test-app-key';
    source = new AdzunaJobSource();
    jest.clearAllMocks();
  });

  test('getSourceName should return "adzuna"', () => {
    expect(source.getSourceName()).toBe('adzuna');
  });

  test('fetchJobs should call Adzuna API with credentials and optional parameters', async () => {
    const rawResponse = {
      data: {
        results: [
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
          }
        ]
      }
    };

    axios.get.mockResolvedValue(rawResponse);

    const jobs = await source.fetchJobs({ country: 'in', page: 1, keyword: 'react' });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('adzuna-1');
    expect(jobs[0].title).toBe('React Dev');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('api/jobs/in/search/1'),
      expect.objectContaining({
        params: expect.objectContaining({
          what: 'react',
          'content-type': 'application/json'
        })
      })
    );
  });
});
