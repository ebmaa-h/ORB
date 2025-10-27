const express = require('express');
const wc = require('../controllers/workflowController.js');
const router = express.Router();
// const { accessGuard } = require('../utils/accessGuard.js');

router.post('/', wc.createBatch);
router.post('/move/:toDepartment', wc.moveBatch);
router.post('/accept', wc.acceptBatch);
router.post('/pullback', wc.cancelTransfer);
router.get('/:department', wc.departmentBatches);
// router.get('/reception', wc.receptionForeignUrgentBatches);

module.exports = router;
