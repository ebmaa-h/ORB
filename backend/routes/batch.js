const express = require('express');
const rc = require('../controllers/receptionController.js');
const router = express.Router();
// const { accessGuard } = require('../utils/accessGuard.js');

// Get all batches
// router.get('/', rc.batches);

router.post('/', rc.createBatch);
router.get('/reception', rc.receptionBatches);

module.exports = router;
