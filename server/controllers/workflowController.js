const { getIO } = require("../sockets/socket.js");
const Note = require('../models/noteModel.js');
const Log = require('../models/logModel.js');
const Batch = require('../models/batchModel.js');
const { WORKFLOW_LOG_EVENTS, logWorkflowEvent, formatLogRow } = require('../utils/workflowLogEngine.js');

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

const resolveBatchTypeFromFlag = (isForeignUrgent = false, isPureForeignUrgent = false) =>
  (isForeignUrgent || isPureForeignUrgent) ? WORKFLOW_BATCH_TYPES.FOREIGN : WORKFLOW_BATCH_TYPES.NORMAL;

const normalizeBooleanFlag = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', ''].includes(normalized)) return false;
  }
  return Boolean(value);
};

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const emitWorkflowNote = (noteRow) => {
  if (!noteRow?.department) return;
  const io = getIO();
  io.to(noteRow.department).emit('workflow:noteCreated', noteRow);
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
        is_pure_foreign_urgent: normalizeBooleanFlag(baseBatch?.is_pure_foreign_urgent),
      });

      const isPure = normalizeBooleanFlag(baseBatch?.is_pure_foreign_urgent);
      if (!isPure) {
        await logWorkflowEvent(WORKFLOW_LOG_EVENTS.BATCH_CREATED, {
          userId: mainData.created_by || null,
          department: 'reception',
          batchType: resolveBatchTypeFromFlag(false, isPure),
          entityType: 'batch',
          entityId: newBatch.batch_id,
          batchId: newBatch.batch_id,
          metadata: { is_pure_foreign_urgent: isPure },
          isPureForeignUrgent: isPure,
        });
      }

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
            is_pure_foreign_urgent: normalizeBooleanFlag(newBatch.is_pure_foreign_urgent),
            client_id: fuFromDb?.client_id || mainData.client_id,
            client_first: fuFromDb?.client_first || baseBatch?.client_first || null,
            client_last: fuFromDb?.client_last || baseBatch?.client_last || null,
            client_type: fuFromDb?.client_type || baseBatch?.client_type || null,
            method_received: fuFromDb?.method_received || baseBatch?.method_received || null,
            date_received: fuFromDb?.date_received || baseBatch?.date_received || mainData.date_received || new Date().toISOString(),
          };
          createdForeignUrgents.push(fuPayload);
          console.log('📤 Emitting batchCreated for foreignUrgent:', fuPayload);
          io.to("reception").emit("batchCreated", fuPayload);

          await logWorkflowEvent(WORKFLOW_LOG_EVENTS.FOREIGN_URGENT_CREATED, {
            userId: mainData.created_by || null,
            department: 'reception',
            batchType: WORKFLOW_BATCH_TYPES.FOREIGN,
            entityType: 'fu',
            entityId: newFu.batch_id,
            batchId: newBatch.batch_id,
            foreignUrgentId: newFu.batch_id,
            metadata: { is_pure_foreign_urgent: isPure },
          });
        }
      }

      res.status(201).json({
        message: "Batch created successfully",
        batch: baseBatch,
        foreign_urgents: createdForeignUrgents,
      });
    } catch (err) {
      console.error('❌ Error creating new batch:', err.message);
      res.status(400).json({ error: err.message });
    }
  },

  getBatchDetails: async (req, res) => {
    try {
      const batchId = toPositiveInt(req.params.batchId);
      const isFu = normalizeBooleanFlag(req.query?.is_fu);
      if (!batchId) {
        return res.status(400).json({ error: 'Invalid batch ID' });
      }
      const batch = isFu ? await Batch.getForeignUrgentById(batchId) : await Batch.getBatchById(batchId);
      if (!batch) {
        return res.status(404).json({ error: `Batch #${batchId} not found` });
      }
      return res.json({
        batch,
        batchType: isFu ? WORKFLOW_BATCH_TYPES.FOREIGN : WORKFLOW_BATCH_TYPES.NORMAL,
        entityType: isFu ? 'fu' : 'batch',
      });
    } catch (err) {
      console.error('Error fetching batch details:', err);
      res.status(500).json({ error: 'Failed to fetch batch details' });
    }
  },

  updateReceptionBatch: async (req, res) => {
    try {
      const rawId = toPositiveInt(req.params.batchId);
      if (!rawId) return res.status(400).json({ error: 'Invalid batch_id' });

      const isFu = normalizeBooleanFlag(req.body?.is_fu);
      const entityType = isFu ? 'fu' : 'batch';

      const {
        batch_size,
        client_id,
        date_received,
        method_received,
        bank_statements,
        added_on_drive,
        corrections,
        cc_availability,
        user_id,
      } = req.body || {};

      const main = await Batch.getWorkflowMainByEntity({ entity_type: entityType, entity_id: rawId });
      if (!main || main.status !== 'current' || !ALLOWED_DEPARTMENTS.includes(main.department)) {
        return res.status(409).json({ error: 'Batch cannot be edited in its current state' });
      }
      const activeDepartment = main.department;

      const boolFields = ['bank_statements', 'added_on_drive', 'corrections'];

      let existingBatch = null;
      let batchIdForUpdate = rawId;
      if (isFu) {
        const fuRow = await Batch.getForeignUrgentById(rawId);
        if (!fuRow) {
          return res.status(404).json({ error: 'Foreign/Urgent batch not found' });
        }
        const parentId = fuRow.parent_batch_id || fuRow.batch_id;
        if (!parentId) {
          return res.status(400).json({ error: 'Parent batch not associated with this foreign/urgent item' });
        }
        const parentBatch = await Batch.getBatchById(parentId);
        if (!parentBatch) {
          return res.status(404).json({ error: 'Parent batch not found' });
        }
        existingBatch = parentBatch;
        batchIdForUpdate = parentId;
      } else {
        existingBatch = await Batch.getBatchById(rawId);
        if (!existingBatch) return res.status(404).json({ error: 'Batch not found' });

        if (!batch_size || Number.isNaN(Number(batch_size))) {
          return res.status(400).json({ error: 'batch_size is required and must be numeric' });
        }
        if (!client_id || Number.isNaN(Number(client_id))) {
          return res.status(400).json({ error: 'client_id is required and must be numeric' });
        }
        if (!date_received) {
          return res.status(400).json({ error: 'date_received is required' });
        }
        if (!method_received) {
          return res.status(400).json({ error: 'method_received is required' });
        }
      }

      const resolveClientId = () => {
        if (client_id === undefined || client_id === null || client_id === '') {
          const fallback = Number(existingBatch.client_id);
          if (Number.isNaN(fallback)) {
            throw new Error('client_id_invalid');
          }
          return fallback;
        }
        if (Number.isNaN(Number(client_id))) {
          throw new Error('client_id_invalid');
        }
        return Number(client_id);
      };

      const normalizedUpdate = isFu
        ? {
            batch_size: Number(existingBatch.batch_size) || 1,
            client_id: resolveClientId(),
            date_received: date_received || existingBatch.date_received,
            method_received: method_received || existingBatch.method_received,
            bank_statements: Number(
              normalizeBooleanFlag(
                bank_statements !== undefined ? bank_statements : existingBatch.bank_statements,
              ),
            ),
            added_on_drive: Number(
              normalizeBooleanFlag(
                added_on_drive !== undefined ? added_on_drive : existingBatch.added_on_drive,
              ),
            ),
            corrections: Number(
              normalizeBooleanFlag(corrections !== undefined ? corrections : existingBatch.corrections),
            ),
            cc_availability:
              typeof cc_availability === 'string'
                ? cc_availability
                : cc_availability !== undefined
                ? cc_availability
                : existingBatch.cc_availability ?? '',
          }
        : {
            batch_size: Number(batch_size),
            client_id: Number(client_id),
            date_received,
            method_received,
            bank_statements: Number(
              normalizeBooleanFlag(
                bank_statements !== undefined ? bank_statements : existingBatch.bank_statements,
              ),
            ),
            added_on_drive: Number(
              normalizeBooleanFlag(
                added_on_drive !== undefined ? added_on_drive : existingBatch.added_on_drive,
              ),
            ),
            corrections: Number(
              normalizeBooleanFlag(corrections !== undefined ? corrections : existingBatch.corrections),
            ),
            cc_availability:
              typeof cc_availability === 'string'
                ? cc_availability
                : cc_availability ?? existingBatch.cc_availability ?? '',
          };

      if (!isFu && normalizedUpdate.client_id === undefined) {
        return res.status(400).json({ error: 'client_id is required and must be numeric' });
      }

      const newIsPure =
        Number(normalizedUpdate.batch_size || 0) === Number(existingBatch.total_urgent_foreign || 0);
      const parentBatchTypeLabel = WORKFLOW_BATCH_TYPES.NORMAL;

      await Batch.updateReceptionFields({
        batch_id: batchIdForUpdate,
        ...normalizedUpdate,
        is_pure_foreign_urgent: newIsPure ? 1 : 0,
      });

      const updatedParent = await Batch.getBatchById(batchIdForUpdate);
      const io = getIO();

      if (updatedParent) {
        io.to(activeDepartment).emit('batchUpdated', {
          ...updatedParent,
          current_department: updatedParent.current_department || activeDepartment,
          status: updatedParent.status || 'current',
          is_pure_foreign_urgent: normalizeBooleanFlag(updatedParent.is_pure_foreign_urgent),
        });
      }

      const changeSummary = {};
      const comparable = (field, value) => {
        if (boolFields.includes(field)) return normalizeBooleanFlag(value);
        if (['batch_size', 'client_id'].includes(field)) return Number(value);
        if (field === 'date_received') {
          const dateVal = value ? new Date(value) : null;
          return dateVal ? dateVal.toISOString().slice(0, 10) : null;
        }
        return value ?? null;
      };

      Object.entries(normalizedUpdate).forEach(([field, value]) => {
        const before = comparable(field, existingBatch[field]);
        const after = comparable(field, value);
        if (before !== after) {
          changeSummary[field] = { before, after };
        }
      });

      if (Object.keys(changeSummary).length) {
        await logWorkflowEvent(WORKFLOW_LOG_EVENTS.BATCH_UPDATED, {
          userId: user_id || null,
          department: activeDepartment,
          batchType: parentBatchTypeLabel,
          entityType: 'batch',
          entityId: batchIdForUpdate,
          batchId: batchIdForUpdate,
          parentBatchId: batchIdForUpdate,
          changes: changeSummary,
        });
      }

      const relatedForeignUrgentIds = await Batch.getForeignUrgentIdsByParent(batchIdForUpdate);
      const relatedForeignUrgents = [];
      if (Array.isArray(relatedForeignUrgentIds) && relatedForeignUrgentIds.length) {
        for (const row of relatedForeignUrgentIds) {
          const fuRow = await Batch.getForeignUrgentById(row.foreign_urgent_batch_id);
          if (!fuRow) continue;
          relatedForeignUrgents.push(fuRow);
          const fuDepartment = fuRow.current_department || activeDepartment;
          io.to(fuDepartment).emit('batchUpdated', {
            ...fuRow,
            current_department: fuDepartment,
            status: fuRow.status || 'current',
          });
          if (Object.keys(changeSummary).length) {
            await logWorkflowEvent(WORKFLOW_LOG_EVENTS.BATCH_UPDATED, {
              userId: user_id || null,
              department: fuDepartment,
              batchType: WORKFLOW_BATCH_TYPES.FOREIGN,
              entityType: 'fu',
              entityId: fuRow.foreign_urgent_batch_id,
              batchId: fuRow.foreign_urgent_batch_id,
              parentBatchId: batchIdForUpdate,
              changes: changeSummary,
            });
          }
        }
      }

      res.json({
        batch: updatedParent,
        foreignUrgents: relatedForeignUrgents,
      });
    } catch (err) {
      if (err.message === 'client_id_invalid') {
        return res.status(400).json({ error: 'client_id is required and must be numeric' });
      }
      console.error('Error updating batch:', err);
      res.status(500).json({ error: 'Failed to update batch' });
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
      const base = (is_fu ? await Batch.getForeignUrgentById(batch_id) : await Batch.getBatchById(batch_id)) || {};
      const batchType = resolveBatchTypeFromFlag(is_fu, normalizeBooleanFlag(base?.is_pure_foreign_urgent));
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

      // maintain transfer trail (one pending record per entity)
      await Batch.deletePendingTransfers({ entity_type, entity_id: batch_id });
      await Batch.insertTransfer({
        entity_type,
        entity_id: batch_id,
        from_department: fromDepartment,
        to_department: finalToDepartment,
        target_status: targetStatus,
        created_by: user_id || null,
      });

      // emit payloads
      const inboxPayload = {
        ...base,
        current_department: finalToDepartment,
        status: targetStatus,
        transfer_from_department: fromDepartment,
        transfer_to_department: finalToDepartment,
      };
      const outboxPayload = {
        ...base,
        current_department: fromDepartment,
        status: 'outbox',
        transfer_from_department: fromDepartment,
        transfer_to_department: finalToDepartment,
      };
      if (fromDepartment) io.to(fromDepartment).emit('batchUpdated', outboxPayload);
      io.to(finalToDepartment).emit('batchUpdated', inboxPayload);

      const destinationLabel = isFiling ? 'filing' : finalToDepartment;
      if (fromDepartment) {
        await logWorkflowEvent(WORKFLOW_LOG_EVENTS.BATCH_SENT, {
          userId: user_id || null,
          department: fromDepartment,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          batchId: batch_id,
          fromDepartment,
          toDepartment: destinationLabel,
        });
      }

      const incomingEvent = isFiling
        ? WORKFLOW_LOG_EVENTS.BATCH_TO_FILING
        : WORKFLOW_LOG_EVENTS.BATCH_RECEIVED;

      await logWorkflowEvent(incomingEvent, {
        userId: user_id || null,
        department: finalToDepartment,
        batchType,
        entityType: entity_type,
        entityId: batch_id,
        batchId: batch_id,
        fromDepartment,
        toDepartment: destinationLabel,
      });

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
      const base = is_fu ? await Batch.getForeignUrgentById(batch_id) : await Batch.getBatchById(batch_id);
      const batchType = resolveBatchTypeFromFlag(is_fu, normalizeBooleanFlag(base?.is_pure_foreign_urgent));
      const main = await Batch.getWorkflowMainByEntity({ entity_type, entity_id: batch_id });
      if (!main) return res.status(404).json({ error: 'Workflow main row not found' });

      const toDept = main.department; // accepting in this dept
      const finalStatus = target_status === 'filing' ? 'filing' : 'current';

      // update main status to current/filing
      await Batch.upsertWorkflowMain({ entity_type, entity_id: batch_id, department: toDept, status: finalStatus, created_by: user_id || null });
      const pendingTransfer = await Batch.getLatestPendingTransfer({
        entity_type,
        entity_id: batch_id,
        to_department: toDept,
      });
      if (pendingTransfer?.transfer_id) {
        await Batch.acceptTransfer({ transfer_id: pendingTransfer.transfer_id, accepted_by: user_id || null });
      }

      // find and remove temp outbox (if exists)
      const outbox = await Batch.getWorkflowOutboxByEntity({ entity_type, entity_id: batch_id });
      if (outbox) {
        await Batch.deleteWorkflowOutbox({ entity_type, entity_id: batch_id });
      }

      const io = getIO();
      const acceptedPayload = { ...base, current_department: toDept, status: finalStatus };
      io.to(toDept).emit('batchUpdated', acceptedPayload);

      if (outbox?.department) {
        // inform previous dept to drop from outbox view
        io.to(outbox.department).emit('batchUpdated', acceptedPayload);
      }

      await logWorkflowEvent(WORKFLOW_LOG_EVENTS.BATCH_ACCEPTED, {
        userId: user_id || null,
        department: toDept,
        batchType,
        entityType: entity_type,
        entityId: batch_id,
        batchId: batch_id,
        status: finalStatus,
      });

      if (outbox?.department) {
        await logWorkflowEvent(WORKFLOW_LOG_EVENTS.BATCH_ACCEPTED_DOWNSTREAM, {
          userId: user_id || null,
          department: outbox.department,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          batchId: batch_id,
          fromDepartment: outbox.department,
          acceptedBy: toDept,
        });
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
      const base = is_fu ? await Batch.getForeignUrgentById(batch_id) : await Batch.getBatchById(batch_id);
      const batchType = resolveBatchTypeFromFlag(is_fu, normalizeBooleanFlag(base?.is_pure_foreign_urgent));
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

      const payload = {
        ...(base || {}),
        batch_id: base?.batch_id || batch_id,
        current_department: originalDepartment,
        status: 'current',
      };

      const io = getIO();
      if (originalDepartment) io.to(originalDepartment).emit('batchUpdated', payload);
      if (targetDepartment && targetDepartment !== originalDepartment) {
        io.to(targetDepartment).emit('batchUpdated', payload);
      }

      if (originalDepartment) {
        await logWorkflowEvent(WORKFLOW_LOG_EVENTS.TRANSFER_CANCELLED, {
          userId: user_id || null,
          department: originalDepartment,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          batchId: batch_id,
          fromDepartment: targetDepartment,
          toDepartment: originalDepartment,
        });
      }

      if (targetDepartment && targetDepartment !== originalDepartment) {
        await logWorkflowEvent(WORKFLOW_LOG_EVENTS.TRANSFER_CANCELLED_REMOTE, {
          userId: user_id || null,
          department: targetDepartment,
          batchType,
          entityType: entity_type,
          entityId: batch_id,
          batchId: batch_id,
          fromDepartment: targetDepartment,
          toDepartment: originalDepartment,
          byDepartment: originalDepartment,
        });
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
      const base = entity_type === 'fu'
        ? await Batch.getForeignUrgentById(batch_id)
        : await Batch.getBatchById(batch_id);
      const batchType = resolveBatchTypeFromFlag(is_fu, normalizeBooleanFlag(base?.is_pure_foreign_urgent));
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

      const payload = {
        ...(base || {}),
        batch_id: base?.batch_id || batch_id,
        parent_batch_id: base?.parent_batch_id,
        current_department: null,
        status: 'archived',
      };

      io.to(main.department).emit('batchUpdated', payload);

      const isReceptionDraft = main.department === 'reception' && main.status === 'current';
      const archiveMessage = isReceptionDraft
        ? `Batch #${batch_id} archived from reception | current batches`
        : `Batch #${batch_id} archived from reception ${main.status}`;

      await logWorkflowEvent(WORKFLOW_LOG_EVENTS.BATCH_ARCHIVED, {
        userId: user_id || null,
        department: main.department,
        batchType,
        entityType: entity_type,
        entityId: batch_id,
        batchId: batch_id,
        isReceptionDraft,
        customMessage: archiveMessage,
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



