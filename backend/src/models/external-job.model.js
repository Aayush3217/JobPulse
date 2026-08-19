const { z } = require('zod');

const externalJobSchema = z.object({
  externalId: z.string().min(1, 'External ID is required'),
  source: z.string().min(1, 'Source name is required'),
  title: z.string().min(1, 'Title is required'),
  companyName: z.string().min(1, 'Company Name is required'),
  location: z.string().nullable().optional(),
  jobType: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  url: z.string().url('Must be a valid URL'),
  publishedAt: z.preprocess((val) => (val ? new Date(val) : null), z.date().nullable().optional()),
  sourceCreatedAt: z.preprocess((val) => (val ? new Date(val) : null), z.date().nullable().optional())
});

module.exports = {
  externalJobSchema
};
