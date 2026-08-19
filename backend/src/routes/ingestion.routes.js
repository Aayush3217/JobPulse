const express = require('express');
const ingestionController = require('../controllers/ingestion.controller');
const { ingestionLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/run', ingestionLimiter, ingestionController.runIngestion);
router.get('/runs', ingestionController.getIngestionRuns);
router.get('/runs/:id', ingestionController.getIngestionRunById);

module.exports = router;
