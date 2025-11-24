import { getPrimaryId, isForeignUrgentEntity, normalizeIsFuFlag } from "../domain/batch";

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
  const rawId = getPrimaryId(meta) ?? meta.fu_batch_id ?? meta.id ?? target ?? null;
  if (rawId === null || rawId === undefined) return null;

  const normalizedId = String(rawId).trim();
  if (!normalizedId) return null;

  const from = buildFromState({ pathname, search, activeStatus, filterType });
  const all = [...batches, ...fuBatches];
  const found = all.find((entry) => getPrimaryId(entry) === normalizedId);

  const isFuContext = filterType === "fu";
  const metaBatchType = (meta.batch_type || "").toLowerCase();
  const metaIsFu =
    normalizeIsFuFlag(meta.is_fu) ||
    normalizeIsFuFlag(meta.isFu) ||
    normalizeIsFuFlag(meta.is_foreign_urgent) ||
    normalizeIsFuFlag(meta.isForeignUrgent);
  const isFu =
    isFuContext ||
    Boolean(
      metaIsFu ||
        meta.foreign_urgent_batch_id ||
        meta.fu_batch_id ||
        meta.foreignUrgentBatchId ||
        metaBatchType === "foreign_urgent" ||
        isForeignUrgentEntity(found),
    );

  const path = buildBatchPath(getPrimaryId(found) || normalizedId, isFu);
  if (!path) return null;

  const state = found ? { batch: found, from } : { from };

  return {
    path,
    state,
    batchId: getPrimaryId(found) || normalizedId,
    batch: found,
    isFu,
    from,
  };
};
