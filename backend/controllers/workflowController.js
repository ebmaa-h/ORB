const { getIO } = require("../sockets/socket.js");
const Note = require('../models/noteModel.js');
const Log = require('../models/logModel.js');
const Batch = require('../models/batchModel.js');

const workflowController = {
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
      // enroll in workflow as reception/current
      await Batch.upsertWorkflowMain({ entity_type: 'batch', entity_id: newBatch.batch_id, department: 'reception', status: 'current', created_by: mainData.created_by || null });
      const io = getIO();
      const baseBatch = await Batch.getBatchById(newBatch.batch_id);
      io.to("reception").emit("batchCreated", {
        ...baseBatch,
        current_department: 'reception',
        status: 'current',
        is_pure_foreign_urgent: baseBatch?.is_pure_foreign_urgent || false,
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
          // enroll FU in workflow as reception/current
          await Batch.upsertWorkflowMain({ entity_type: 'fu', entity_id: newFu.batch_id, department: 'reception', status: 'current', created_by: mainData.created_by || null });
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

  departmentBatches: async (req, res) => {
    try {
      const department = String(req.params.department || '').toLowerCase();
      const allowed = ['reception', 'admittance', 'billing'];
      if (!allowed.includes(department)) {
        return res.status(400).json({ error: 'Invalid department' });
      }
      const results = await Batch.getDepartmentBatches(department);
      res.json(results);
    } catch (err) {
      console.error("Error fetching department batches:", err);
      res.status(500).json({ error: "Failed to fetch department batches" });
    }
  },

  moveBatch: async (req, res) => {
    try {
      let toDepartment = String(req.params.toDepartment || '').toLowerCase();
      const { batch_id, is_fu, user_id } = req.body || {};
      const isFiling = toDepartment === 'filing';
      if (!batch_id) return res.status(400).json({ error: 'batch_id is required' });

      const allowed = ['reception', 'admittance', 'billing', 'filing'];
      if (!allowed.includes(toDepartment)) return res.status(400).json({ error: 'Invalid target department' });

      const io = getIO();

      const entity_type = is_fu ? 'fu' : 'batch';
      const main = await Batch.getWorkflowMainByEntity({ entity_type, entity_id: batch_id });
      if (!main) return res.status(404).json({ error: 'Workflow main row not found' });

      const fromDepartment = main.department;
      const finalToDepartment = isFiling ? 'reception' : toDepartment;
      const targetStatus = isFiling ? 'filing' : 'inbox';

      if (user_id) {
        if (toDepartment === 'billing') {
          await Batch.markAdmitted({ entity_type, entity_id: batch_id, user_id });
        } else if (toDepartment === 'filing') {
          await Batch.markBilled({ entity_type, entity_id: batch_id, user_id });
        }
      }

      // 1) move main to target dept inbox
      await Batch.upsertWorkflowMain({
        entity_type,
        entity_id: batch_id,
        department: finalToDepartment,
        status: targetStatus,
        created_by: user_id || null,
      });

      // 2) create/update temp outbox on sender dept
      await Batch.upsertWorkflowOutbox({ entity_type, entity_id: batch_id, department: fromDepartment, created_by: user_id || null });

      // emit payloads
      const base = (is_fu ? await Batch.getForeignUrgentById(batch_id) : await Batch.getBatchById(batch_id)) || {};
      const inboxPayload = { ...base, current_department: finalToDepartment, status: targetStatus };
      const outboxPayload = { ...base, current_department: fromDepartment, status: 'outbox' };
      if (fromDepartment) io.to(fromDepartment).emit('batchUpdated', outboxPayload);
      io.to(finalToDepartment).emit('batchUpdated', inboxPayload);

      res.json({ success: true, outbox: outboxPayload, inbox: inboxPayload });
    } catch (err) {
      console.error('Error moving batch:', err);
      res.status(500).json({ error: 'Failed to move batch' });
    }
  },

  acceptBatch: async (req, res) => {
    try {
      const { batch_id, is_fu, user_id, target_status } = req.body || {};
      if (!batch_id) return res.status(400).json({ error: 'batch_id is required' });

      const entity_type = is_fu ? 'fu' : 'batch';
      const main = await Batch.getWorkflowMainByEntity({ entity_type, entity_id: batch_id });
      if (!main) return res.status(404).json({ error: 'Workflow main row not found' });

      const toDept = main.department; // accepting in this dept
      const finalStatus = target_status === 'filing' ? 'filing' : 'current';

      // update main status to current/filing
      await Batch.upsertWorkflowMain({ entity_type, entity_id: batch_id, department: toDept, status: finalStatus, created_by: user_id || null });

      // find and remove temp outbox (if exists)
      const outbox = await Batch.getWorkflowOutboxByEntity({ entity_type, entity_id: batch_id });
      if (outbox) {
        await Batch.deleteWorkflowOutbox({ entity_type, entity_id: batch_id });
      }

      const io = getIO();
      const base = is_fu ? await Batch.getForeignUrgentById(batch_id) : await Batch.getBatchById(batch_id);
      const acceptedPayload = { ...base, current_department: toDept, status: finalStatus };
      io.to(toDept).emit('batchUpdated', acceptedPayload);

      if (outbox?.department) {
        // inform previous dept to drop from outbox view
        io.to(outbox.department).emit('batchUpdated', acceptedPayload);
      }

      res.json(acceptedPayload);
    } catch (err) {
      console.error('Error accepting batch:', err);
      res.status(500).json({ error: 'Failed to accept batch' });
    }
  },

  cancelTransfer: async (req, res) => {
    try {
      const { batch_id, is_fu, user_id } = req.body || {};
      if (!batch_id) return res.status(400).json({ error: 'batch_id is required' });

      const entity_type = is_fu ? 'fu' : 'batch';
      const outbox = await Batch.getWorkflowOutboxByEntity({ entity_type, entity_id: batch_id });
      if (!outbox) return res.status(404).json({ error: 'Outbox entry not found' });

      const main = await Batch.getWorkflowMainByEntity({ entity_type, entity_id: batch_id });
      const targetDepartment = main?.department || null;
      const originalDepartment = outbox.department;

      await Batch.upsertWorkflowMain({
        entity_type,
        entity_id: batch_id,
        department: originalDepartment,
        status: 'current',
        created_by: user_id || null,
      });

      await Batch.deleteWorkflowOutbox({ entity_type, entity_id: batch_id });

      const base = (is_fu ? await Batch.getForeignUrgentById(batch_id) : await Batch.getBatchById(batch_id)) || {};
      const payload = {
        ...base,
        batch_id: base.batch_id || batch_id,
        current_department: originalDepartment,
        status: 'current',
      };

      const io = getIO();
      if (originalDepartment) io.to(originalDepartment).emit('batchUpdated', payload);
      if (targetDepartment && targetDepartment !== originalDepartment) {
        io.to(targetDepartment).emit('batchUpdated', payload);
      }

      res.json(payload);
    } catch (err) {
      console.error('Error cancelling transfer:', err);
      res.status(500).json({ error: 'Failed to cancel transfer' });
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

module.exports = workflowController;


