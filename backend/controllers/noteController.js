const Note = require('../models/noteModel.js');

const noteController = {
  // Consolidated GET function
  getNotes: async (req, res) => {
    const { targetTable, targetId } = req.params;

    try {
      if (!['accounts', 'invoices'].includes(targetTable)) {
        return res.status(404).json({ message: 'Invalid target table specified' });
      }
  
      const notes = await Note.fetchNotes(targetTable, targetId);
  
      if (notes.length === 0) {
        return res.status(200).json({ message: 'No notes yet.', notes: [] });
      }
  
      return res.status(200).json({ message: 'Notes retrieved', notes });
    } catch (err) {
      console.error('Error fetching notes:', err);
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  },


  // Consolidated POST function
  addNote: async (req, res) => {
    const { targetTable, targetId } = req.params;
    const { userId, note } = req.body;

    if (!['accounts', 'invoices'].includes(targetTable)) {
      return res.status(400).json({ message: 'Invalid target table specified' });
    }
    if (!targetId || !userId || !note) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      const newNote = await Note.createNote({
        target_table: targetTable,
        target_id: targetId,
        user_id: userId,
        note: note,
      });

      return res.status(201).json({
        message: 'Note added successfully',
        note: newNote,
      });
    } catch (err) {
      console.error('Error adding note:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },
};

module.exports = noteController;
