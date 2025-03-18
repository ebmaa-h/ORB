const express = require('express');
const noteController = require('../controllers/noteController.js');
const router = express.Router();

router.get('/accounts/:accountId', noteController.getAccNotes);
router.get('/invoices/:invoiceId', noteController.getInvoiceNotes);

module.exports = router;