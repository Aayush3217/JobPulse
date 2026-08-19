const express = require('express');
const sourceController = require('../controllers/source.controller');

const router = express.Router();

router.get('/', sourceController.getSources);
router.get('/:source/health', sourceController.getSourceHealth);

module.exports = router;
