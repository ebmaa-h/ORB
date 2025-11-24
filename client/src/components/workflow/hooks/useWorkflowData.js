import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../../utils/axiosClient";
import socket from "../../../utils/socket";
import {
  getPrimaryId,
  isForeignUrgentEntity,
  normalizeBatchIdentity,
  normalizeIsPureFlag,
} from "../../../domain/batch";

export const useWorkflowData = ({ department, endpoint }) => {
  const [batches, setBatches] = useState([]);
  const [fuBatches, setFuBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const applyBatchUpdate = useCallback(
    (incoming) => {
      if (!incoming) return;

      const normalized = normalizeBatchIdentity(
        {
          ...incoming,
          current_department: incoming.current_department || department,
          status: incoming.status || "current",
          is_pure_foreign_urgent: normalizeIsPureFlag(incoming.is_pure_foreign_urgent),
        },
        department,
      );

      const primaryId = normalized.primary_id;
      if (!primaryId) return;

      const isFU = isForeignUrgentEntity(normalized);
      const appliesToDept = normalized.current_department === department;

      if (isFU) {
        setFuBatches((prev) => {
          const exists = prev.some((b) => getPrimaryId(b) === primaryId);
          if (!appliesToDept) {
            return prev.filter((b) => getPrimaryId(b) !== primaryId);
          }
          if (exists) {
            return prev.map((b) => (getPrimaryId(b) === primaryId ? { ...b, ...normalized } : b));
          }
          return [...prev, normalized];
        });
        return;
      }

      if (normalized.is_pure_foreign_urgent) {
        setBatches((prev) => prev.filter((b) => getPrimaryId(b) !== primaryId));
        return;
      }

      setBatches((prev) => {
        const exists = prev.some((b) => getPrimaryId(b) === primaryId);
        if (!appliesToDept) {
          return prev.filter((b) => getPrimaryId(b) !== primaryId);
        }
        if (exists) {
          return prev.map((b) => (getPrimaryId(b) === primaryId ? { ...b, ...normalized } : b));
        }
        return [...prev, normalized];
      });
    },
    [department],
  );

  useEffect(() => {
    let mounted = true;

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(endpoint);
        if (!mounted) return;
        const { normal = [], foreignUrgent = [] } = res.data || {};
        const normalizedNormal = normal.map((item) =>
          normalizeBatchIdentity(
            { ...item, is_pure_foreign_urgent: normalizeIsPureFlag(item.is_pure_foreign_urgent) },
            department,
          ),
        );
        const normalizedFu = foreignUrgent.map((item) =>
          normalizeBatchIdentity(
            { ...item, is_pure_foreign_urgent: normalizeIsPureFlag(item.is_pure_foreign_urgent) },
            department,
          ),
        );
        setBatches(
          normalizedNormal.filter(
            (b) => !b.is_pure_foreign_urgent && b.current_department === department,
          ),
        );
        setFuBatches(normalizedFu.filter((b) => b.current_department === department));
      } catch (err) {
        console.error(`❌ WorkflowEngine fetch error for ${department}:`, err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!endpoint) {
      setBatches([]);
      setFuBatches([]);
      setLoading(false);
      return () => {};
    }

    fetchInitial();

    return () => {
      mounted = false;
    };
  }, [department, endpoint]);

  useEffect(() => {
    if (!socket.connected) {
      console.log("🔌 Connecting socket...");
      socket.connect();
    }

    socket.emit("joinRoom", department);
    console.log(`📡 Emitted joinRoom for ${department}`);

    const logBatch = (label, batch) => {
      console.log(`[socket] ${label} for ${department}`, batch);
    };

    const normalizeIncomingBatch = (incoming) => {
      if (!incoming) return incoming;
      return {
        ...incoming,
        current_department: incoming.current_department || department,
        status: incoming.status || "current",
        is_pure_foreign_urgent: normalizeIsPureFlag(incoming.is_pure_foreign_urgent),
      };
    };

    const handleCreated = (newBatch) => {
      const normalized = normalizeBatchIdentity(normalizeIncomingBatch(newBatch), department);
      logBatch("batchCreated", normalized);
      if (!normalized.current_department || normalized.current_department !== department) {
        console.log(
          `[socket] batchCreated ignored: wrong department ${normalized.current_department} for ${department}`,
        );
        return;
      }

      if (isForeignUrgentEntity(normalized)) {
        setFuBatches((prev) => {
          if (prev.some((b) => getPrimaryId(b) === getPrimaryId(normalized))) {
            console.log(`[socket] foreign urgent batch ${getPrimaryId(normalized)} already exists`);
            return prev;
          }
          console.log(`[socket] adding foreign urgent batch ${getPrimaryId(normalized)}`);
          return [normalized, ...prev];
        });
      } else if (!normalized.is_pure_foreign_urgent) {
        setBatches((prev) => {
          if (prev.some((b) => getPrimaryId(b) === getPrimaryId(normalized))) {
            console.log(`[socket] normal batch ${getPrimaryId(normalized)} already exists`);
            return prev;
          }
          console.log(`[socket] adding normal batch ${getPrimaryId(normalized)}`);
          return [normalized, ...prev];
        });
      } else {
        console.log(`[socket] skipping pure foreign urgent batch ${getPrimaryId(normalized)}`);
      }
    };

    const handleUpdated = (updated) => {
      applyBatchUpdate(normalizeBatchIdentity(updated, department));
    };

    socket.on("batchCreated", handleCreated);
    socket.on("batchUpdated", handleUpdated);

    socket.on("test", (data) => {
      console.log("🔔 Test event received:", data);
    });

    return () => {
      socket.off("batchCreated", handleCreated);
      socket.off("batchUpdated", handleUpdated);
      socket.off("test");
      try {
        socket.emit("leaveRoom", department);
        console.log(`📡 Emitted leaveRoom for ${department}`);
      } catch (e) {
        console.warn(`Failed to leave room ${department}:`, e);
      }
    };
  }, [department, applyBatchUpdate]);

  return {
    batches,
    fuBatches,
    loading,
    applyBatchUpdate,
  };
};
