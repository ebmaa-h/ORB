const { WORKFLOW_LOG_EVENTS, logWorkflowEvent } = require('./workflowLogEngine');

const INVOICE_FIELDS = ['nr_in_batch', 'date_of_service', 'status', 'file_nr', 'balance', 'auth_nr', 'type'];
const PERSON_FIELDS = ['first', 'last', 'title', 'date_of_birth', 'gender', 'id_type', 'id_nr', 'dependent_nr'];
const MEDICAL_AID_FIELDS = ['medical_aid_nr', 'medical_aid_id', 'plan_id'];

const normalizeComparableValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
};

const toInvoiceSnapshot = (row = null) => {
  if (!row) {
    return {
      invoice: INVOICE_FIELDS.reduce((acc, key) => ({ ...acc, [key]: null }), {}),
      medicalAid: MEDICAL_AID_FIELDS.reduce((acc, key) => ({ ...acc, [key]: null }), {}),
      member: PERSON_FIELDS.reduce((acc, key) => ({ ...acc, [key]: null }), {}),
      patient: PERSON_FIELDS.reduce((acc, key) => ({ ...acc, [key]: null }), {}),
    };
  }

  return {
    invoice: {
      nr_in_batch: row.nr_in_batch ?? null,
      date_of_service: row.date_of_service || null,
      status: row.status || null,
      file_nr: row.file_nr || null,
      balance: row.balance !== undefined && row.balance !== null ? Number(row.balance) : null,
      auth_nr: row.auth_nr || null,
      type: row.invoice_type || null,
    },
    medicalAid: {
      medical_aid_nr: row.medical_aid_nr || null,
      medical_aid_id: row.medical_aid_id ?? null,
      plan_id: row.plan_id ?? null,
    },
    member: {
      first: row.main_member_first || null,
      last: row.main_member_last || null,
      title: row.main_member_title || null,
      date_of_birth: row.main_member_dob || null,
      gender: row.main_member_gender || null,
      id_type: row.main_member_id_type || null,
      id_nr: row.main_member_id_nr || null,
      dependent_nr: row.main_member_dependent_nr || null,
    },
    patient: {
      first: row.patient_first || null,
      last: row.patient_last || null,
      title: row.patient_title || null,
      date_of_birth: row.patient_dob || null,
      gender: row.patient_gender || null,
      id_type: row.patient_id_type || null,
      id_nr: row.patient_id_nr || null,
      dependent_nr: row.patient_dependent_nr || null,
    },
  };
};

const registerGroupChanges = (result, groupName, fields, prevSnapshot, nextSnapshot) => {
  fields.forEach((field) => {
    const prevValue = prevSnapshot[groupName][field];
    const nextValue = nextSnapshot[groupName][field];
    const prevComparable = normalizeComparableValue(prevValue);
    const nextComparable = normalizeComparableValue(nextValue);
    if (prevComparable === nextComparable) return;
    result[`${groupName}.${field}`] = {
      before: prevValue ?? null,
      after: nextValue ?? null,
    };
  });
};

const computeInvoiceChanges = (previousInvoice, nextInvoice) => {
  if (!nextInvoice) return {};
  const previousSnapshot = toInvoiceSnapshot(previousInvoice);
  const nextSnapshot = toInvoiceSnapshot(nextInvoice);
  const changes = {};
  registerGroupChanges(changes, 'invoice', INVOICE_FIELDS, previousSnapshot, nextSnapshot);
  registerGroupChanges(changes, 'medicalAid', MEDICAL_AID_FIELDS, previousSnapshot, nextSnapshot);
  registerGroupChanges(changes, 'member', PERSON_FIELDS, previousSnapshot, nextSnapshot);
  registerGroupChanges(changes, 'patient', PERSON_FIELDS, previousSnapshot, nextSnapshot);
  return changes;
};

const normalizeBatchFlag = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes'].includes(normalized);
};

const getBatchTypeKey = (batch) => (normalizeBatchFlag(batch?.is_pure_foreign_urgent) ? 'foreign_urgent' : 'normal');

const getDepartmentKey = (batch) => {
  const dept = (batch?.current_department || '').trim().toLowerCase();
  return dept || 'reception';
};

const logInvoiceChange = async ({
  userId = null,
  batch = null,
  accountId = null,
  profileId = null,
  previousInvoice = null,
  nextInvoice = null,
  eventType = 'update',
}) => {
  if (!batch || !nextInvoice) return null;

  const changes = computeInvoiceChanges(previousInvoice, nextInvoice);
  const hasChanges = Object.keys(changes).length > 0;
  if (!hasChanges && eventType !== 'create') {
    return null;
  }

  try {
    return await logWorkflowEvent(WORKFLOW_LOG_EVENTS.ACCOUNT_INFO_CHANGED, {
      userId,
      department: getDepartmentKey(batch),
      batchType: getBatchTypeKey(batch),
      entityType: 'invoice',
      entityId: nextInvoice.invoice_id,
      batchId: batch.batch_id,
      accountId,
      profileId,
      invoiceId: nextInvoice.invoice_id,
      changes,
      eventType,
    });
  } catch (err) {
    console.error('Account log error:', err);
    return null;
  }
};

module.exports = {
  computeInvoiceChanges,
  logInvoiceChange,
};
