const { getIO } = require('../sockets/socket');
const Log = require('../models/logModel');
const { WORKFLOW_LOG_EVENT_CONFIG, WORKFLOW_LOG_EVENTS } = require('../config/workflowLogEvents');

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
  try {
    const io = getIO();
    io.to(logRow.department).emit('workflow:logCreated', formatLogRow(logRow));
  } catch (err) {
    console.warn('Failed to emit workflow log event:', err);
  }
};

const recordWorkflowLog = async (logInput = {}) => {
  const logRow = await Log.createWorkflowLog(logInput);
  const formatted = formatLogRow(logRow);
  emitWorkflowLog(formatted);
  return formatted;
};

const recordWorkflowLogs = async (logs = []) => {
  const tasks = logs.filter(Boolean).map((log) => recordWorkflowLog(log));
  return Promise.all(tasks);
};

const mergeMetadata = (eventConfig, context) => {
  const baseMetadata =
    typeof eventConfig.buildMetadata === 'function'
      ? eventConfig.buildMetadata(context)
      : eventConfig.metadata || null;
  const extra = context.metadata || null;

  if (!baseMetadata && !extra) return null;
  if (baseMetadata && extra) return { ...baseMetadata, ...extra };
  return baseMetadata || extra;
};

const resolveMessage = (eventConfig, context) => {
  if (context.customMessage) return context.customMessage;
  if (typeof eventConfig.buildMessage === 'function') {
    return eventConfig.buildMessage(context);
  }
  return eventConfig.message || '';
};

const logWorkflowEvent = async (eventKey, context = {}) => {
  const eventConfig = WORKFLOW_LOG_EVENT_CONFIG[eventKey];
  if (!eventConfig) {
    console.warn(`[workflowLogEngine] Unknown event: ${eventKey}`);
    return null;
  }

  const payload = {
    userId: context.userId ?? null,
    department: context.department,
    batchType: context.batchType ?? null,
    entityType: context.entityType ?? null,
    entityId: context.entityId ?? null,
    action: eventConfig.action,
    message: resolveMessage(eventConfig, context),
    metadata: mergeMetadata(eventConfig, context),
  };

  if (!payload.department || !payload.action) {
    console.warn('[workflowLogEngine] Missing required log payload fields', payload);
    return null;
  }

  return recordWorkflowLog(payload);
};

module.exports = {
  WORKFLOW_LOG_EVENTS,
  logWorkflowEvent,
  recordWorkflowLog,
  recordWorkflowLogs,
  formatLogRow,
};
