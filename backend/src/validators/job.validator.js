const { z } = require('zod');

const getJobsQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  location: z.string().trim().optional(),
  jobType: z.string().trim().optional(),
  category: z.string().trim().optional(),
  source: z.string().trim().optional(),
  page: z.preprocess(
    (val) => (val === undefined ? 0 : parseInt(String(val), 10)), 
    z.number().int().min(0).default(0)
  ),
  size: z.preprocess(
    (val) => (val === undefined ? 20 : parseInt(String(val), 10)), 
    z.number().int().min(1).max(100).default(20)
  ),
  sort: z.string().trim().optional().default('publishedAt_desc')
});

const getJobByIdParamsSchema = z.object({
  id: z.string().min(1, 'Job ID is required')
});

module.exports = {
  getJobsQuerySchema,
  getJobByIdParamsSchema
};
