const express = require('express');
const invoiceController = require('../../../backend/controllers/invoiceController.js');
const router = express.Router();

// Check if user is authorized to client
// Check if user can view/edit invoices
router.get('/:invoiceId', invoiceController.getInvoice);

// Check if is authorized to generate new invoices
router.get('/new/:accountId', invoiceController.getInvoice);

// Check if user is authorized to client
router.get('/clients/:clientId', invoiceController.getInvoicesByClient);

// Check if user is authorized to client
// Check if user is authorized to edit invoices
router.patch('/update', invoiceController.updateInvoice);

module.exports = router;