const express = require('express');
const invoiceController = require('../controllers/invoiceController.js');
const router = express.Router();

router.get('/', invoiceController.getInvoices);

router.get('/:invoiceId', invoiceController.getInvoice);

router.get('/clients/:clientId', invoiceController.getInvoicesByClient);

router.post('/new/:accountId', invoiceController.createNewInvoice);
router.post('/new', invoiceController.createNewInvoice);
router.patch('/update', invoiceController.updateInvoice);

module.exports = router;