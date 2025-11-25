import { getIdForBatchType, getPrimaryId, isForeignUrgentEntity, normalizeIsFuFlag } from "../domain/batch";

export const buildBatchPath = (batchId, isFu = false) => {
  const normalizedId = String(batchId ?? "").trim();
  if (!normalizedId) return null;
  const basePath = isFu ? "/fu-batches" : "/batches";
  return `${basePath}/${normalizedId}`;
};

export const buildFromState = ({ pathname = "", search = "", activeStatus, filterType }) => ({
  path: `${pathname}${search}`,
  activeStatus,
  filterType,
});

/**
 * Standardizes navigation payload for batches and foreign/urgent batches.
 * Accepts a target (id or meta), the current filter context, and known batches.
 */
export const deriveBatchNavigation = ({
  target,
  batches = [],
  fuBatches = [],
  activeStatus,
  filterType,
  pathname,
  search,
}) => {
  const meta =
    target && typeof target === "object" ? target.meta || target.metadata || target : {};
  const preferredType =
    (meta.batchType || meta.batch_type || meta.entity_type || meta.entityType || "").toLowerCase() ||
    (filterType === "fu" ? "foreign_urgent" : "normal");

  const isFuPreferred = preferredType === "foreign_urgent" || preferredType === "fu";

  const from = buildFromState({ pathname, search, activeStatus, filterType });

  const pool = isFuPreferred ? fuBatches : batches;
  const idCandidate =
    getIdForBatchType(meta, preferredType) ??
    (preferredType === "foreign_urgent" || preferredType === "fu" ? meta.foreign_urgent_id : null) ??
    meta.batchId ??
    meta.batch_id ??
    meta.id ??
    (target && typeof target === "object" ? target.batchId || target.batch_id : target) ??
    null;
  const normalizedId =
    idCandidate !== null && idCandidate !== undefined ? String(idCandidate).trim() : null;
  if (!normalizedId) return null;

  const found = pool.find((entry) => getIdForBatchType(entry, preferredType) === normalizedId);

  const path = buildBatchPath(normalizedId, isFuPreferred);
  if (!path) return null;

  const state = found ? { batch: found, from, batchType: preferredType } : { from, batchType: preferredType };

  return {
    path,
    state,
    batchId: normalizedId,
    batch: found,
    isFu: isFuPreferred,
    batchType: preferredType,
    from,
  };
};
