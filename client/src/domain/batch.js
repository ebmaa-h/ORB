// Shared helpers to keep batch identity/flags consistent across the app.

export const normalizeIsPureFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "false", "no", "n", ""].includes(normalized)) return false;
  }
  return Boolean(value);
};

export const normalizeIsFuFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "false", "no", "n", ""].includes(normalized)) return false;
  }
  return Boolean(value);
};

export const getPrimaryId = (batch) => {
  if (!batch) return null;
  const raw =
    batch.foreign_urgent_batch_id ??
    batch.batch_id ??
    batch.batchId ??
    batch.id ??
    null;
  if (raw === null || raw === undefined) return null;
  const normalized = String(raw).trim();
  return normalized || null;
};

export const isForeignUrgentEntity = (batch) =>
  Boolean(batch?.foreign_urgent_batch_id) || normalizeIsFuFlag(batch?.is_fu);

export const normalizeBatchIdentity = (batch = {}, fallbackDepartment = null) => {
  const id = getPrimaryId(batch);
  const isFu = isForeignUrgentEntity(batch);
  const normalized = {
    ...batch,
    primary_id: id,
    is_fu: isFu,
  };

  if (fallbackDepartment && !normalized.current_department) {
    normalized.current_department = fallbackDepartment;
  }

  return normalized;
};

export const getIdForBatchType = (batch = {}, batchType = "normal") => {
  const typeKey = (batchType || "").toLowerCase();
  if (typeKey === "foreign_urgent" || typeKey === "fu") {
    return batch.foreign_urgent_batch_id ?? batch.foreignUrgentBatchId ?? batch.fu_batch_id ?? null;
  }
  return batch.batch_id ?? batch.batchId ?? null;
};
