const WORKFLOW_LOG_EVENT_CONFIG = {
  BATCH_CREATED: {
    action: 'batch_created',
    buildMessage: ({ batchId, department }) => `Batch #${batchId} created in ${department}`,
    buildMetadata: ({ batchId }) => ({ batch_id: batchId }),
  },
  FOREIGN_URGENT_CREATED: {
    action: 'foreign_urgent_created',
    buildMessage: ({ foreignUrgentId, batchId }) =>
      `Foreign urgent #${foreignUrgentId} created.`,
    buildMetadata: ({ batchId, foreignUrgentId }) => ({
      batch_id: batchId,
      foreign_urgent_id: foreignUrgentId,
    }),
  },
  BATCH_UPDATED: {
    action: 'batch_updated',
    buildMessage: ({ batchId, department }) => `Batch #${batchId} updated in ${department}`,
    buildMetadata: ({ batchId, changes }) => ({ batch_id: batchId, changes }),
  },
  BATCH_SENT: {
    action: 'batch_sent',
    buildMessage: ({ batchId, toDepartment }) => `Batch #${batchId} sent to ${toDepartment}`,
    buildMetadata: ({ batchId, fromDepartment, toDepartment, entityType }) => ({
      batch_id: batchId,
      from: fromDepartment,
      to: toDepartment,
      entity_type: entityType,
    }),
  },
  BATCH_RECEIVED: {
    action: 'batch_received',
    buildMessage: ({ batchId, fromDepartment }) =>
      `Batch #${batchId} received from ${fromDepartment || 'unknown'}`,
    buildMetadata: ({ batchId, fromDepartment, toDepartment, entityType }) => ({
      batch_id: batchId,
      from: fromDepartment,
      to: toDepartment,
      entity_type: entityType,
    }),
  },
  BATCH_TO_FILING: {
    action: 'batch_to_filing',
    buildMessage: ({ batchId }) => `Batch #${batchId} moved to filing`,
    buildMetadata: ({ batchId, fromDepartment, entityType }) => ({
      batch_id: batchId,
      from: fromDepartment,
      to: 'filing',
      entity_type: entityType,
    }),
  },
  BATCH_ACCEPTED: {
    action: 'batch_accepted',
    buildMessage: ({ batchId, department }) => `Batch #${batchId} accepted into ${department}`,
    buildMetadata: ({ batchId, department, status }) => ({
      batch_id: batchId,
      department,
      status,
    }),
  },
  BATCH_ACCEPTED_DOWNSTREAM: {
    action: 'batch_accepted_downstream',
    buildMessage: ({ batchId, acceptedBy }) => `Batch #${batchId} accepted by ${acceptedBy}`,
    buildMetadata: ({ batchId, fromDepartment, acceptedBy }) => ({
      batch_id: batchId,
      from: fromDepartment,
      accepted_by: acceptedBy,
    }),
  },
  TRANSFER_CANCELLED: {
    action: 'transfer_cancelled',
    buildMessage: ({ batchId, toDepartment }) => `Batch #${batchId} pulled back to ${toDepartment}`,
    buildMetadata: ({ batchId, fromDepartment, toDepartment }) => ({
      batch_id: batchId,
      from: fromDepartment,
      to: toDepartment,
    }),
  },
  TRANSFER_CANCELLED_REMOTE: {
    action: 'transfer_cancelled_remote',
    buildMessage: ({ batchId, byDepartment }) =>
      `Batch #${batchId} pulled back by ${byDepartment || 'originating department'}`,
    buildMetadata: ({ batchId, fromDepartment, toDepartment }) => ({
      batch_id: batchId,
      from: fromDepartment,
      to: toDepartment,
    }),
  },
  BATCH_ARCHIVED: {
    action: 'batch_archived',
    buildMessage: ({ batchId, department, isReceptionDraft, customMessage }) =>
      customMessage ||
      (isReceptionDraft
        ? `Batch #${batchId} archived from reception | current batches`
        : `Batch #${batchId} archived from ${department}`),
    buildMetadata: ({ batchId, department, isReceptionDraft }) => ({
      batch_id: batchId,
      department,
      isReceptionDraft,
    }),
  },
  ACCOUNT_INFO_CHANGED: {
    action: 'account_info_changed',
    buildMessage: ({ invoiceId, accountId, eventType }) => {
      if (!invoiceId) return 'Invoice updated';
      if (eventType === 'create') {
        return accountId
          ? `Invoice #${invoiceId} created for account #${accountId}`
          : `Invoice #${invoiceId} created`;
      }
      return accountId
        ? `Invoice #${invoiceId} updated for account #${accountId}`
        : `Invoice #${invoiceId} updated`;
    },
    buildMetadata: ({ batchId, invoiceId, accountId, profileId, changes }) => ({
      batch_id: batchId,
      invoice_id: invoiceId,
      account_id: accountId,
      profile_id: profileId,
      changes: changes || {},
    }),
  },
};

const WORKFLOW_LOG_EVENTS = Object.freeze(
  Object.keys(WORKFLOW_LOG_EVENT_CONFIG).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {})
);

module.exports = {
  WORKFLOW_LOG_EVENT_CONFIG,
  WORKFLOW_LOG_EVENTS,
};
