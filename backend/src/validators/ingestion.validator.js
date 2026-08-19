const { z } = require('zod');

const runIngestionBodySchema = z.object({
  source: z.string().min(1, 'Source name is required'),
  limit: z.preprocess(
    (val) => (val === undefined ? undefined : parseInt(String(val), 10)), 
    z.number().int().min(1).optional()
  ),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  country: z.string().trim().optional(),
  page: z.preprocess(
    (val) => (val === undefined ? undefined : parseInt(String(val), 10)), 
    z.number().int().min(1).optional()
  ),
  keyword: z.string().trim().optional(),
  location: z.string().trim().optional(),
  results_per_page: z.preprocess(
    (val) => (val === undefined ? undefined : parseInt(String(val), 10)), 
    z.number().int().min(1).optional()
  )
});

const getIngestionRunParamsSchema = z.object({
  id: z.string().min(1, 'Ingestion Run ID is required')
});

module.exports = {
  runIngestionBodySchema,
  getIngestionRunParamsSchema
};
