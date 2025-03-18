
const Note = require('../models/noteModel.js');

const noteController = {
  getAccNotes: async (req, res) => {
    const accountId = req.params.accountId;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    try {
      const notes = await Note.fetchAccNotes(accountId);
      if (!notes || notes.length === 0) {
        console.log('No notes found.');
        return res.status(404).json({ message: 'No notes found' });
      }

      console.log('Notes Found:', notes);
      return res.status(200).json({
        message: 'Notes retrieval successful',
        notes,
      });
    } catch (err) {
      console.error('Error finding notes:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  getInvoiceNotes: async (req, res) => {
    const invoiceId = req.params.invoiceId;

    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    try {
      const notes = await Note.fetchInvoiceNotes(invoiceId);
      if (!notes || notes.length === 0) {
        console.log('No notes found.');
        return res.status(404).json({ message: 'No notes found' });
      }

      console.log('Notes Found:', notes);
      return res.status(200).json({
        message: 'Notes retrieval successful',
        notes,
      });
    } catch (err) {
      console.error('Error finding notes:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

};

module.exports = noteController;
