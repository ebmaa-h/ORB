// batchRoutes.js
const express = require('express');
const bc = require('../controllers/batchController.js');
const router = express.Router();
// const { accessGuard } = require('../utils/accessGuard.js');

// Get all batches (with auth middleware if needed)
router.get('/', bc.batches);
router.post('/', bc.createBatch);

module.exports = router;
