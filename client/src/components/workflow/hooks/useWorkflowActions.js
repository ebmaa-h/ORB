import { useCallback } from "react";
import axiosClient from "../../../utils/axiosClient";
import ENDPOINTS from "../../../utils/apiEndpoints";
import { getPrimaryId, isForeignUrgentEntity } from "../../../domain/batch";

export const useWorkflowActions = ({ user, department, applyBatchUpdate }) => {
  const handleReceptionUpdate = useCallback(
    async (batchId, updates) => {
      try {
        const payload = {
          ...updates,
          user_id: user?.user_id || null,
        };
        const res = await axiosClient.patch(ENDPOINTS.updateBatch(batchId), payload);
        if (res?.data) {
          const payload = res.data;
          if (payload.batch) {
            applyBatchUpdate(payload.batch);
          }
          if (Array.isArray(payload.foreignUrgents)) {
            payload.foreignUrgents.forEach((fu) => applyBatchUpdate(fu));
          }
          if (!payload.batch && !Array.isArray(payload.foreignUrgents)) {
            applyBatchUpdate(payload);
          }
          return { success: true, batch: payload.batch || payload };
        }
        return { success: false, error: "No data returned" };
      } catch (err) {
        console.error(`Failed to update batch ${batchId}:`, err);
        const message = err?.response?.data?.error || "Failed to update batch";
        return { success: false, error: message };
      }
    },
    [user, applyBatchUpdate],
  );

  const handleArchiveDraft = useCallback(
    async (batch) => {
      try {
        const res = await axiosClient.post(ENDPOINTS.archiveBatch, {
          batch_id: getPrimaryId(batch),
          is_fu: isForeignUrgentEntity(batch),
          user_id: user?.user_id || null,
        });
        if (res?.data) {
          applyBatchUpdate(res.data);
          return { success: true };
        }
        return { success: false, error: "No data returned" };
      } catch (err) {
        console.error("Failed to archive batch:", err);
        const message = err?.response?.data?.error || "Failed to archive batch";
        return { success: false, error: message };
      }
    },
    [user, applyBatchUpdate],
  );

  const executeAction = useCallback(
    async (action, batch) => {
      try {
        if (batch.is_pure_foreign_urgent && !batch.parent_batch_id) {
          console.log(`Skipping action for pure foreign/urgent batch ${getPrimaryId(batch)}`);
          return;
        }
        const url = ENDPOINTS[action.endpointKey];
        if (!url) {
          console.error("Missing endpoint for action", action);
          return;
        }
        const payload = {
          batch_id: getPrimaryId(batch),
          is_fu: isForeignUrgentEntity(batch),
          user_id: user?.user_id,
        };
        if (action.target_status) payload.target_status = action.target_status;
        if (action.endpointKey === "acceptBatch") {
          payload.to_department = department;
        }
        const res = await axiosClient[action.method || "post"](url, payload);
        if (res?.data) {
          console.log(`Action response for ${action.name}:`, res.data);
          const applyCandidates = (responsePayload) => {
            if (!responsePayload) return;
            if (Array.isArray(responsePayload)) {
              responsePayload.forEach(applyBatchUpdate);
              return;
            }
            applyBatchUpdate(responsePayload);
            if (responsePayload.inbox) applyBatchUpdate(responsePayload.inbox);
            if (responsePayload.outbox) applyBatchUpdate(responsePayload.outbox);
            if (responsePayload.filing) applyBatchUpdate(responsePayload.filing);
          };
          applyCandidates(res.data);
        }
      } catch (err) {
        console.error(`Action failed for ${action.name}:`, err);
      }
    },
    [user, department, applyBatchUpdate],
  );

  return {
    handleReceptionUpdate,
    handleArchiveDraft,
    executeAction,
  };
};
