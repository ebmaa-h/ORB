const { getIO } = require("../sockets/socket.js");
const Note = require('../models/noteModel.js');
const Log = require('../models/logModel.js');
const Batch = require('../models/batchModel.js');

const WORKFLOW_BATCH_TYPES = {
  NORMAL: 'normal',
  FOREIGN: 'foreign_urgent',
};

const ALLOWED_DEPARTMENTS = ['reception', 'admittance', 'billing'];

const normalizeBatchType = (value = '') => {
  const normalized = String(value || '').toLowerCase();
  if (['fu', 'foreign', 'foreign_urgent', 'foreign-urgent'].includes(normalized)) {
    return WORKFLOW_BATCH_TYPES.FOREIGN;
  }
  return WORKFLOW_BATCH_TYPES.NORMAL;
};

const resolveBatchTypeFromFlag = (isForeignUrgent = false) =>
  isForeignUrgent ? WORKFLOW_BATCH_TYPES.FOREIGN : WORKFLOW_BATCH_TYPES.NORMAL;

const parseMetadata = (metadata) => {
  if (!metadata) return null;
  if (typeof metadata === 'object') return metadata;
  try {
    return JSON.parse(metadata);
  } catch (err) {
    console.warn('Failed to parse workflow log metadata:', err);
    return null;
  }
};

const formatLogRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    metadata: parseMetadata(row.metadata),
  };
};

const emitWorkflowLog = (logRow) => {
  if (!logRow?.department) return;
  const io = getIO();
  io.to(logRow.department).emit('workflow:logCreated', formatLogRow(logRow));
};

const emitWorkflowNote = (noteRow) => {
  if (!noteRow?.department) return;
  const io = getIO();
  io.to(noteRow.department).emit('workflow:noteCreated', noteRow);
};

const recordWorkflowLog = async (logInput) => {
  const logRow = await Log.createWorkflowLog(logInput);
  const formatted = formatLogRow(logRow);
  emitWorkflowLog(formatted);
  return formatted;
};

const recordWorkflowLogs = async (logs = []) => {
  const results = [];
  for (const log of logs) {
    if (!log) continue;
    results.push(await recordWorkflowLog(log));
  }
  return results;
};

const createWorkflowNote = async (noteInput) => {
  const noteRow = await Note.createWorkflowNote(noteInput);
  emitWorkflowNote(noteRow);
  return noteRow;
};

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

      await recordWorkflowLog({
        userId: mainData.created_by || null,
        department: 'reception',
        batchType: WORKFLOW_BATCH_TYPES.NORMAL,
        entityType: 'batch',
        entityId: newBatch.batch_id,
        action: 'batch_created',
        message: `Batch #${newBatch.batch_id} created in reception`,
        metadata: { batch_id: newBatch.batch_id },
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
          const fuFromDb = await Batch.getForeignUrgentById(newFu.batch_id);
          const fuPayload = {
            ...fuFromDb,
            batch_id: fuFromDb?.batch_id || newFu.batch_id,
            parent_batch_id: fuFromDb?.parent_batch_id || newFu.parent_batch_id,
            current_department: fuFromDb?.current_department || 'reception',
            status: fuFromDb?.status || 'current',
            is_pure_foreign_urgent: newBatch.is_pure_foreign_urgent || false,
            client_id: fuFromDb?.client_id || mainData.client_id,
            date_received: fuFromDb?.date_received || mainData.date_received || new Date().toISOString(),
          };
          createdForeignUrgents.push(fuPayload);
          console.log('📤 Emitting batchCreated for foreignUrgent:', fuPayload);
          io.to("reception").emit("batchCreated", fuPayload);

          await recordWorkflowLog({
            userId: mainData.created_by || null,
            department: 'reception',
            batchType: WORKFLOW_BATCH_TYPES.FOREIGN,
            entityType: 'fu',
            entityId: newFu.batch_id,
            action: 'foreign_urgent_created',
            message: `Foreign urgent #${newFu.batch_id} created for batch #${newBatch.batch_id}`,
            metadata: { batch_id: newBatch.batch_id, foreign_urgent_id: newFu.batch_id },
          });
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
      if (!ALLOWED_DEPARTMENTS.includes(department)) {
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
      const batchType = resolveBatchTypeFromFlag(is_fu);
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

      const destinationLabel = isFiling ? 'filing' : finalToDepartment;
      const moveLogs = [];

      if (fromDepartment) {
        moveLogs.push({
          userId: user_id || null,
          department: fromDepartment,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          action: 'batch_sent',
          message: `Batch #${batch_id} sent to ${destinationLabel}`,
          metadata: { batch_id, from: fromDepartment, to: destinationLabel, entity_type },
        });
      }

      moveLogs.push({
        userId: user_id || null,
        department: finalToDepartment,
        batchType,
        entityType: entity_type,
        entityId: batch_id,
        action: isFiling ? 'batch_to_filing' : 'batch_received',
        message: isFiling
          ? `Batch #${batch_id} moved to filing`
          : `Batch #${batch_id} received from ${fromDepartment || 'unknown'}`,
        metadata: { batch_id, from: fromDepartment, to: destinationLabel, entity_type },
      });

      await recordWorkflowLogs(moveLogs);

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
      const batchType = resolveBatchTypeFromFlag(is_fu);
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

      const acceptLogs = [
        {
          userId: user_id || null,
          department: toDept,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          action: 'batch_accepted',
          message: `Batch #${batch_id} accepted into ${toDept}`,
          metadata: { batch_id, department: toDept, status: finalStatus },
        },
      ];

      if (outbox?.department) {
        acceptLogs.push({
          userId: user_id || null,
          department: outbox.department,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          action: 'batch_accepted_downstream',
          message: `Batch #${batch_id} accepted by ${toDept}`,
          metadata: { batch_id, from: outbox.department, accepted_by: toDept },
        });
      }

      await recordWorkflowLogs(acceptLogs);

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
      const batchType = resolveBatchTypeFromFlag(is_fu);
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

      const cancelLogs = [];

      if (originalDepartment) {
        cancelLogs.push({
          userId: user_id || null,
          department: originalDepartment,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          action: 'transfer_cancelled',
          message: `Batch #${batch_id} pulled back to ${originalDepartment}`,
          metadata: { batch_id, from: targetDepartment, to: originalDepartment },
        });
      }

      if (targetDepartment && targetDepartment !== originalDepartment) {
        cancelLogs.push({
          userId: user_id || null,
          department: targetDepartment,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          action: 'transfer_cancelled_remote',
          message: `Batch #${batch_id} pulled back by ${originalDepartment || 'originating department'}`,
          metadata: { batch_id, from: targetDepartment, to: originalDepartment },
        });
      }

      if (cancelLogs.length) {
        await recordWorkflowLogs(cancelLogs);
      }

      res.json(payload);
    } catch (err) {
      console.error('Error cancelling transfer:', err);
      res.status(500).json({ error: 'Failed to cancel transfer' });
    }
  },

  archiveBatch: async (req, res) => {
    try {
      const { batch_id, is_fu, user_id } = req.body || {};
      if (!batch_id) return res.status(400).json({ error: 'batch_id is required' });

      const entity_type = is_fu ? 'fu' : 'batch';
      const batchType = resolveBatchTypeFromFlag(is_fu);
      const main = await Batch.getWorkflowMainByEntity({ entity_type, entity_id: batch_id });
      if (!main) return res.status(404).json({ error: 'Workflow main row not found' });

      await Batch.deleteWorkflowMain({ entity_type, entity_id: batch_id });
      await Batch.deleteWorkflowOutbox({ entity_type, entity_id: batch_id });

      if (entity_type === 'fu') {
        await Batch.archiveForeignUrgent({ entity_id: batch_id, filed_by: user_id || null });
      } else {
        await Batch.archiveBatch({ entity_id: batch_id, filed_by: user_id || null });
      }

      const io = getIO();
      const base = entity_type === 'fu'
        ? await Batch.getForeignUrgentById(batch_id)
        : await Batch.getBatchById(batch_id);

      const payload = {
        ...(base || {}),
        batch_id: base?.batch_id || batch_id,
        parent_batch_id: base?.parent_batch_id,
        current_department: null,
        status: 'archived',
      };

      io.to(main.department).emit('batchUpdated', payload);

      await recordWorkflowLog({
        userId: user_id || null,
        department: main.department,
        batchType,
        entityType: entity_type,
        entityId: batch_id,
        action: 'batch_archived',
        message: `Batch #${batch_id} archived from filing`,
        metadata: { batch_id, department: main.department },
      });

      res.json(payload);
    } catch (err) {
      console.error('Error archiving batch:', err);
      res.status(500).json({ error: 'Failed to archive batch' });
    }
  },

  listClients: async (_req, res) => {
    try {
      const clients = await Batch.listClients();
      res.json(clients);
    } catch (err) {
      console.error('Error fetching clients list:', err);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  },

  getWorkflowNotes: async (req, res) => {
    try {
      const department = String(req.params.department || '').toLowerCase();
      const batchType = normalizeBatchType(req.params.batchType);
      if (!ALLOWED_DEPARTMENTS.includes(department)) {
        return res.status(400).json({ error: 'Invalid department' });
      }

      const notes = await Note.listWorkflowNotes({ department, batchType });
      res.json(notes);
    } catch (err) {
      console.error('Workflow error fetching notes:', err);
      res.status(500).json({ error: 'Failed to fetch workflow notes' });
    }
  },

  addWorkflowNote: async (req, res) => {
    try {
      const department = String(req.params.department || '').toLowerCase();
      const batchType = normalizeBatchType(req.params.batchType);
      if (!ALLOWED_DEPARTMENTS.includes(department)) {
        return res.status(400).json({ error: 'Invalid department' });
      }

      const { userId, note, entityType = null, entityId = null } = req.body || {};
      const trimmedNote = String(note || '').trim();
      if (!trimmedNote) {
        return res.status(400).json({ error: 'Note cannot be empty' });
      }

      const finalUserId = userId || req.user?.user_id || null;
      if (!finalUserId) {
        return res.status(401).json({ error: 'User context missing for note' });
      }

      const newNote = await createWorkflowNote({
        department,
        batchType,
        userId: finalUserId,
        note: trimmedNote,
        entityType,
        entityId,
      });

      res.status(201).json(newNote);
    } catch (err) {
      console.error('Workflow error creating note:', err);
      res.status(500).json({ error: 'Failed to create workflow note' });
    }
  },

  getWorkflowLogs: async (req, res) => {
    try {
      const department = String(req.params.department || '').toLowerCase();
      const batchType = normalizeBatchType(req.params.batchType);
      if (!ALLOWED_DEPARTMENTS.includes(department)) {
        return res.status(400).json({ error: 'Invalid department' });
      }

      const logs = await Log.listWorkflowLogs({ department, batchType });
      res.json(logs.map(formatLogRow));
    } catch (err) {
      console.error('Workflow error fetching logs:', err);
      res.status(500).json({ error: 'Failed to fetch workflow logs' });
    }
  },
};

module.exports = workflowController;


