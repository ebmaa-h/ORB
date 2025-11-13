const express = require('express');
const wc = require('../controllers/workflowController.js');
const invoiceController = require('../controllers/invoiceController.js');
const accountController = require('../controllers/accountController.js');
const router = express.Router();
// const { accessGuard } = require('../utils/accessGuard.js');

router.post('/', wc.createBatch);
router.post('/move/:toDepartment', wc.moveBatch);
router.post('/accept', wc.acceptBatch);
router.post('/pullback', wc.cancelTransfer);
router.post('/archive', wc.archiveBatch);
router.get('/clients', wc.listClients);
router.patch('/:batchId/update', wc.updateReceptionBatch);
router.get('/:batchId/invoices', invoiceController.getBatchInvoices);
router.post('/:batchId/accounts', accountController.createBatchAccount);
router.get('/:department', wc.departmentBatches);
// router.get('/reception', wc.receptionForeignUrgentBatches);

module.exports = router;
