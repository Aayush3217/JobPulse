const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

// Routes
const healthRouter = require('./routes/health.routes');
const jobsRouter = require('./routes/job.routes');
const sourcesRouter = require('./routes/source.routes');
const ingestionRouter = require('./routes/ingestion.routes');

const app = express();

// Security middlewares
app.use(helmet());

// CORS config: dynamically reflect request origin to prevent deployment blocks
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser
app.use(express.json());

// General rate limiter for all api queries
app.use('/api/', apiLimiter);

// Routing
app.use('/api/health', healthRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/ingestion', ingestionRouter);

// Fallbacks
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
