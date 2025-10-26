const { getIO } = require("../sockets/socket.js");
const Note = require('../models/noteModel');
const Log = require('../models/logModel');
const Batch = require('../models/batchModel');

const receptionController = {
  createBatch: async (req, res) => {
    console.log("🧩 Received in createBatch:", req.body);
    try {
      const { foreign_urgents, ...mainData } = req.body;
      
      // validate total_urgent_foreign <= batch_size
      if (Number(mainData.total_urgent_foreign || 0) > Number(mainData.batch_size || 0)) {
        throw new Error('total_urgent_foreign cannot exceed batch_size');
      }

      // create main batch
      const newBatch = await Batch.create(mainData);
      const io = getIO();
      io.to("reception").emit("batchCreated", {
        ...newBatch,
        current_department: newBatch.current_department || 'reception',
        status: newBatch.status || 'current',
        is_pure_foreign_urgent: newBatch.is_pure_foreign_urgent || false,
      });

      // Create foreign/urgent if present
      const createdForeignUrgents = [];
      if (Array.isArray(foreign_urgents) && foreign_urgents.length > 0) {
        for (const fu of foreign_urgents) {
          const fuData = {
            batch_id: newBatch.batch_id,
            patient_name: fu.patient_name,
            medical_aid_nr: fu.medical_aid_nr,
          };
          const newFu = await Batch.createForeignUrgent(fuData);
          const newFuWithInherited = {
            batch_id: newFu.batch_id,
            parent_batch_id: newFu.parent_batch_id,
            patient_name: newFu.patient_name,
            medical_aid_nr: newFu.medical_aid_nr,
            current_department: newFu.current_department || 'reception',
            status: newFu.status || 'current',
            created_by: mainData.created_by,
            client_id: mainData.client_id,
            date_received: mainData.date_received || new Date().toISOString(),
            created_at: newFu.created_at || new Date().toISOString(),
            updated_at: newFu.updated_at || new Date().toISOString(),
            is_pure_foreign_urgent: newBatch.is_pure_foreign_urgent || false,
          };
          createdForeignUrgents.push(newFuWithInherited);
          console.log('📤 Emitting batchCreated for foreignUrgent:', newFuWithInherited);
          io.to("reception").emit("batchCreated", newFuWithInherited);
        }
      }

      res.status(201).json({
        message: "Batch created successfully",
        batch: newBatch,
        foreign_urgents: createdForeignUrgents,
      });
    } catch (err) {
      console.error('❌ Error creating new batch:', err.message);
      res.status(400).json({ error: err.message });
    }
  },

  receptionBatches: async (req, res) => {
    try {
      const results = await Batch.getReceptionBatches();
      res.json(results);
    } catch (err) {
      console.error("Error fetching reception batches:", err);
      res.status(500).json({ error: "Failed to fetch reception batches" });
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