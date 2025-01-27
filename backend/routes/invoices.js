const express = require('express');
const invoiceController = require('../controllers/invoiceController.js');
const router = express.Router();

router.get('/', invoiceController.getInvoices); // Get all invoices
router.get('/:invoiceId', invoiceController.getInvoice); // Get a invoice by id
router.get('/clients/:clientId', invoiceController.getInvoicesByClient); // Get invoices by client ID

module.exports = router;