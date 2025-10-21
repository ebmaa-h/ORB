const express = require('express');
const rc = require('../controllers/receptionController.js');
const router = express.Router();
// const { accessGuard } = require('../utils/accessGuard.js');

router.post('/', rc.createBatch);
router.get('/reception', rc.receptionBatches);
router.get('/admittance', rc.receptionBatches);
router.get('/billing', rc.receptionBatches);
// router.get('/reception', rc.receptionForeignUrgentBatches);

module.exports = router;
