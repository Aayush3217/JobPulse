const dotenv = require('dotenv');
const path = require('path');
const { z } = require('zod');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  INGESTION_CRON: z.string().default('0 */6 * * *'),
  ADZUNA_APP_ID: isTest ? z.string().optional() : z.string().min(1, 'ADZUNA_APP_ID is required'),
  ADZUNA_APP_KEY: isTest ? z.string().optional() : z.string().min(1, 'ADZUNA_APP_KEY is required')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

module.exports = parsedEnv.data;
