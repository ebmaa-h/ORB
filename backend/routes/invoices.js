const express = require('express');
const invoiceController = require('../controllers/invoiceController.js');
const router = express.Router();

router.get('/', invoiceController.getInvoices);

router.get('/:invoiceId', invoiceController.getInvoice);

router.get('/clients/:clientId', invoiceController.getInvoicesByClient);

module.exports = router;