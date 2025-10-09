const Note = require('../models/noteModel');
const Log = require('../models/logModel');
const Batch = require('../models/batchModel');

const receptionController = {

  createBatch: async (req, res) => {
    console.log("🧩 Received in createBatch:", req.body);
    console.log("🧩 req.body:", req?.body);
    try {
      const newBatch = await Batch.create(req.body);
      res.status(201).json({ message: "Batch created successfully", batch: newBatch });
    } catch (err) {
      console.error('❌ Error creating new batch:', err);
      if (res) res.status(500).json({ error: 'Failed to create batch' });
      else throw err;
    }
  },

  // reception department batches
  receptionBatches: async (req, res) => {
    try {
      const results = await Batch.getReceptionBatches();
      res.json(results);
    } catch (err) {
      console.error("Error fetching batches:", err);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  },


  getNotes: async (reqOrData, res) => {
    try {
      const targetId = reqOrData.params ? reqOrData.params.targetId : reqOrData.targetId;
      const notes = await Note.listNotes('batches', targetId);

      if (res) {
        res.json(notes);
      } else {
        return notes;
      }
    } catch (err) {
      console.error('❌ Error fetching notes:', err);
      if (res) res.status(500).json({ error: 'Failed to fetch notes' });
      else throw err;
    }
  },

  createNote: async (reqOrData, res) => {
    try {
      const targetId = reqOrData.params ? reqOrData.params.targetId : reqOrData.targetId;
      const { userId, note } = reqOrData.body || reqOrData;

      const newNote = await Note.createNote({
        target_table: 'batches',
        target_id: targetId,
        user_id: userId,
        note,
      });

      if (res) {
        res.status(201).json(newNote);
      } else {
        return newNote;
      }
    } catch (err) {
      console.error('❌ Error creating note:', err);
      if (res) res.status(500).json({ error: 'Failed to create note' });
      else throw err;
    }
  },

  createLog: async (reqOrData, res) => {
    try {
      const { userId, action, changes, targetId } = reqOrData.body || reqOrData;
      const log = await Log.createLog(userId, action, 'batches', targetId, changes);

      if (res) {
        res.status(201).json({ message: 'Log added successfully' });
      } else {
        return log;
      }
    } catch (err) {
      console.error('❌ Error creating log:', err);
      if (res) res.status(500).json({ error: 'Failed to create log' });
      else throw err;
    }
  },
};

module.exports = receptionController;
