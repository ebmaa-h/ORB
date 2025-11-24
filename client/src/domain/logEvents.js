// Central place to enumerate log actions and entity types.
// Keeps UI + backend aligned and prevents ad-hoc strings.

export const LOG_ENTITY_TYPES = {
  BATCH: "batch",
  ACCOUNT: "account",
  CLIENT: "client",
  USER: "user",
};

export const LOG_EVENT_TYPES = {
  BATCH_CREATED: "BATCH_CREATED",
  BATCH_UPDATED: "BATCH_UPDATED",
  STATUS_CHANGED: "STATUS_CHANGED",
  DEPARTMENT_CHANGED: "DEPARTMENT_CHANGED",
  ASSIGNED: "ASSIGNED",
  ACCOUNT_ADDED: "ACCOUNT_ADDED",
  ACCOUNT_UPDATED: "ACCOUNT_UPDATED",
  ACCOUNT_REMOVED: "ACCOUNT_REMOVED",
  NOTES_ADDED: "NOTES_ADDED",
  FILE_ATTACHED: "FILE_ATTACHED",
  ARCHIVED: "ARCHIVED",
};
