const express = require('express');
const invoiceController = require('../controllers/invoiceController.js');
const router = express.Router();

router.get('/', invoiceController.getInvoices); // Get all invoices
router.get('/:invoiceId', invoiceController.getInvoice); // Get a invoice by id
router.get('/doctors/:doctorId', invoiceController.getInvoicesByDoctor); // Get invoices by doctor ID

module.exports = router;