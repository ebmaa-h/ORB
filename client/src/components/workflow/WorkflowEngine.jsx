// src/components/Workflow/WorkflowEngine.jsx
import React, { useEffect, useState, useMemo, useContext, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import WORKFLOW_CONFIG from "../../config/workflowConfig";
import ENDPOINTS from "../../utils/apiEndpoints";
import axiosClient from "../../utils/axiosClient";
import socket from "../../utils/socket";
import WorkflowTable from "./WorkflowTable";
import { UserContext } from "../../context/UserContext";
import { NewBatch } from "../index";
import EntityNotesAndLogs from "../ui/EntityNotesAndLogs";
import SearchBar from "../ui/SearchBar";

const LOGS_TAB = "logs";

const normalizeIsPureFlag = (value) => {
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

const getPrimaryId = (batch) => {
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

const isForeignUrgentEntity = (batch) => Boolean(batch?.foreign_urgent_batch_id || batch?.is_fu);

const normalizeBatchIdentity = (batch = {}) => {
  const id = getPrimaryId(batch);
  const isFu = isForeignUrgentEntity(batch);
  return {
    ...batch,
    primary_id: id,
    is_fu: isFu,
  };
};

export default function WorkflowEngine({ department = "none" }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const config = WORKFLOW_CONFIG[department];
  const [batches, setBatches] = useState([]);
  const [fuBatches, setFuBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("normal");
  const [activeStatus, setActiveStatus] = useState("current");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [clients, setClients] = useState([]);
  const endpoint = config?.endpointKey ? ENDPOINTS[config.endpointKey] : null;
  const normalizedBatchType = useMemo(
    () => (filterType === "fu" ? "foreign_urgent" : "normal"),
    [filterType],
  );
  const statusTabs = useMemo(() => {
    const base = config?.tables || [];
    return base.filter((tab) => tab.name !== "filing");
  }, [config]);
  const filingTab = useMemo(() => {
    return (config?.tables || []).find((tab) => tab.name === "filing") || null;
  }, [config]);
  const showLogsTab = activeStatus === LOGS_TAB;

  const hasAppliedActiveStatusRef = useRef(false);

  useEffect(() => {
    const desiredStatus = location.state?.activeStatus;
    if (hasAppliedActiveStatusRef.current) return;
    if (desiredStatus) {
      hasAppliedActiveStatusRef.current = true;
      if (desiredStatus !== activeStatus) {
        setActiveStatus(desiredStatus);
      }
    }
  }, [location.state?.activeStatus, activeStatus]);
  const handleNavigateToBatch = useCallback(
    (target) => {
      const meta =
        target && typeof target === "object"
          ? target.meta || target.metadata || target
          : {};
      const rawId = getPrimaryId(meta) ?? meta.fu_batch_id ?? meta.id ?? target ?? null;
      if (rawId === null || rawId === undefined) return false;
      const normalizedId = String(rawId).trim();
      if (!normalizedId) return false;
      const fromPath = `${location.pathname}${location.search}`;
      const fromState = { path: fromPath, activeStatus };
      const allBatches = [...batches, ...fuBatches];
      const found = allBatches.find((entry) => getPrimaryId(entry) === normalizedId);
      const isFuContext = filterType === "fu";
      const isFu =
        isFuContext ||
        Boolean(
          meta.foreign_urgent_batch_id ||
            (meta.batch_type || "").toLowerCase() === "foreign_urgent" ||
            isForeignUrgentEntity(found),
        );
      const basePath = isFu ? "/fu-batches" : "/batches";
      if (found) {
        navigate(`${basePath}/${getPrimaryId(found)}`, { state: { batch: found, from: fromState } });
        return true;
      }
      navigate(`${basePath}/${normalizedId}`, { state: { from: fromState } });
      return true;
    },
    [batches, fuBatches, navigate, location.pathname, location.search, activeStatus, filterType],
  );

  useEffect(() => {
    setShowNewBatchForm(false);
  }, [department]);

  useEffect(() => {
    if (activeStatus === LOGS_TAB) {
      setShowNewBatchForm(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    let ignore = false;
    const fetchClients = async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.workflowClients);
        if (!ignore) setClients(res.data || []);
      } catch (err) {
        console.error("Failed to load workflow clients:", err);
        if (!ignore) setClients([]);
      }
    };
    fetchClients();
    return () => {
      ignore = true;
    };
  }, []);

  // fetch initial batches
  useEffect(() => {
    let mounted = true;

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(endpoint);
        if (!mounted) return;
        console.log(`ðŸ“¥ Fetch response for ${department}:`, res.data);
        const { normal = [], foreignUrgent = [] } = res.data || {};
        const normalizedNormal = normal.map(normalizeBatchIdentity);
        const normalizedFu = foreignUrgent.map(normalizeBatchIdentity);
        setBatches(normalizedNormal.filter(b => !b.is_pure_foreign_urgent && b.current_department === department));
        setFuBatches(normalizedFu.filter(b => b.current_department === department));
      } catch (err) {
        console.error(`âŒ WorkflowEngine fetch error for ${department}:`, err);
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

  const applyBatchUpdate = useCallback(
    (incoming) => {
      if (!incoming) return;

      const normalized = normalizeBatchIdentity({
        ...incoming,
        current_department: incoming.current_department || department,
        status: incoming.status || "current",
        is_pure_foreign_urgent: normalizeIsPureFlag(incoming.is_pure_foreign_urgent),
      });

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

  const handleReceptionUpdate = useCallback(
    async (batchId, updates) => {
      try {
        const payload = {
          ...updates,
          user_id: user?.user_id || null,
        };
        const res = await axiosClient.patch(ENDPOINTS.updateBatch(batchId), payload);
        if (res?.data) {
          applyBatchUpdate(res.data);
          return { success: true, batch: res.data };
        }
        return { success: false, error: "No data returned" };
      } catch (err) {
        console.error(`Failed to update batch ${batchId}:`, err);
        const message = err?.response?.data?.error || "Failed to update batch";
        return { success: false, error: message };
      }
    },
    [user, applyBatchUpdate]
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
    [user, applyBatchUpdate]
  );

  // web sockets
  useEffect(() => {
    if (!socket.connected) {
      console.log('ðŸ”Œ Connecting socket...');
      socket.connect();
    }

    socket.emit("joinRoom", department);
    console.log(`ðŸ”— Emitted joinRoom for ${department}`);

    const logBatch = (label, batch) => {
      console.log(`[socket] ${label} for ${department}`, batch);
    };

    const normalizeIncomingBatch = (incoming) => {
      if (!incoming) return incoming;

      const pureFlag = (() => {
        if (typeof incoming.is_pure_foreign_urgent === "boolean") return incoming.is_pure_foreign_urgent;
        if (incoming.is_pure_foreign_urgent === null || incoming.is_pure_foreign_urgent === undefined) return false;
        const numeric = Number(incoming.is_pure_foreign_urgent);
        if (!Number.isNaN(numeric)) return numeric === 1;
        if (typeof incoming.is_pure_foreign_urgent === "string") {
          const lowered = incoming.is_pure_foreign_urgent.toLowerCase();
          if (["true", "yes", "y"].includes(lowered)) return true;
          if (["false", "no", "n", ""].includes(lowered)) return false;
        }
        return Boolean(incoming.is_pure_foreign_urgent);
      })();

      return {
        ...incoming,
        current_department: incoming.current_department || department,
        status: incoming.status || "current",
        is_pure_foreign_urgent: pureFlag,
      };
    };

    const handleCreated = (newBatch) => {
      const normalized = normalizeBatchIdentity(normalizeIncomingBatch(newBatch));
      logBatch('batchCreated', normalized);
      if (!normalized.current_department || normalized.current_department !== department) {
        console.log(`[socket] batchCreated ignored: wrong department ${normalized.current_department} for ${department}`);
        return;
      }
      if (isForeignUrgentEntity(normalized)) { // foreignUrgent batch
        setFuBatches((prev) => {
          if (prev.some((b) => getPrimaryId(b) === getPrimaryId(normalized))) {
            console.log(`[socket] foreign urgent batch ${getPrimaryId(normalized)} already exists`);
            return prev;
          }
          console.log(`[socket] adding foreign urgent batch ${getPrimaryId(normalized)}`);
          return [normalized, ...prev];
        });
      } else if (!normalized.is_pure_foreign_urgent) { // normal batch
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

    socket.on("batchCreated", handleCreated);

    const handleUpdated = (updated) => {
      applyBatchUpdate(normalizeBatchIdentity(updated));
    };

    socket.on("batchUpdated", handleUpdated);

    socket.on("test", (data) => {
      console.log('ðŸ”” Test event received:', data);
    });

    return () => {
      socket.off("batchCreated", handleCreated);
      socket.off("batchUpdated", handleUpdated);
      socket.off("test");
      try {
        socket.emit("leaveRoom", department);
        console.log(`ðŸ”— Emitted leaveRoom for ${department}`);
      } catch (e) {
        console.warn(`Failed to leave room ${department}:`, e);
      }
    };
  }, [department]);

  // filtered data
  const { visibleBatches, tableColumns } = useMemo(() => {
    const columns = filterType === "fu" && config?.foreignUrgentColumns
      ? config.foreignUrgentColumns
      : config?.columns || [];
    const filtered = filterType === "normal"
      ? batches.filter(b => b.current_department === department)
      : fuBatches.filter(b => b.current_department === department);

    // apply search
    const searchLower = searchTerm.toLowerCase();
    const searchedBatches = filtered.filter((batch) => {
      if (filterType === "normal") {
        return (
          String(getPrimaryId(batch) || "").toLowerCase().includes(searchLower) ||
          String(batch.client_id || "").toLowerCase().includes(searchLower) ||
          String(batch.created_by || "").toLowerCase().includes(searchLower) ||
          String(batch.client_first || "").toLowerCase().includes(searchLower) ||
          String(batch.client_last || "").toLowerCase().includes(searchLower)
        );
      } else {
        return (
          String(batch.foreign_urgent_batch_id || getPrimaryId(batch) || "").toLowerCase().includes(searchLower) ||
          String(batch.patient_name || "").toLowerCase().includes(searchLower) ||
          String(batch.medical_aid_nr || "").toLowerCase().includes(searchLower)
        );
      }
    });

    return { visibleBatches: searchedBatches, tableColumns: columns };
  }, [batches, fuBatches, filterType, config, department, searchTerm]);

  const mainActionsForTable = useMemo(() => {
    if (!config) return [];
    if (showLogsTab) return [];
    if (activeStatus === "inbox") return config.inboxActions || [];
    if (activeStatus === "outbox") return config.outboxActions || [];
    if (activeStatus === "filing" && config.filingActions) return config.filingActions;
    return config.expandedActionsMain || config.mainActions || [];
  }, [activeStatus, config, showLogsTab]);

  const dropdownActionsForTable = useMemo(() => {
    if (!config) return [];
     if (showLogsTab) return [];
    if (activeStatus === "inbox" || activeStatus === "outbox") return [];
    return config.expandedActions || config.actions || [];
  }, [activeStatus, config, showLogsTab]);

  // actions
  const executeAction = async (action, batch) => {
    try {
      if (batch.is_pure_foreign_urgent && !batch.parent_batch_id) {
        console.log(`Skipping action for pure foreign/urgent batch ${getPrimaryId(batch)}`);
        return;
      }
      const url = ENDPOINTS[action.endpointKey];
      if (!url) return console.error("Missing endpoint for action", action);
      const payload = { batch_id: getPrimaryId(batch), is_fu: isForeignUrgentEntity(batch), user_id: user?.user_id };
      if (action.target_status) payload.target_status = action.target_status;
      if (action.endpointKey === 'acceptBatch') {
        payload.to_department = department;
      }
      const res = await axiosClient[action.method || "post"](url, payload);
      if (res?.data) {
        console.log(`Action response for ${action.name}:`, res.data);
        const applyCandidates = (payload) => {
          if (!payload) return;
          if (Array.isArray(payload)) {
            payload.forEach(applyBatchUpdate);
            return;
          }
          applyBatchUpdate(payload);
          if (payload.inbox) applyBatchUpdate(payload.inbox);
          if (payload.outbox) applyBatchUpdate(payload.outbox);
          if (payload.filing) applyBatchUpdate(payload.filing);
        };
        applyCandidates(res.data);
      }
    } catch (err) {
      console.error(`Action failed for ${action.name}:`, err);
    }
  };

  // sync selected batch
  useEffect(() => {
    if (!selectedBatch) return;
    const updated = [...batches, ...fuBatches].find(
      (b) => getPrimaryId(b) === getPrimaryId(selectedBatch)
    );
    if (!updated) setSelectedBatch(null);
    else if (updated !== selectedBatch) setSelectedBatch(updated);
  }, [batches, fuBatches, selectedBatch]);

  return (
    <div className="">
      <div className="tab-panel w-full">
        <div className="flex gap-2 flex-wrap items-center">
          {statusTabs.map((table) => {
            const label = table.label || table.name;
            const active = activeStatus === table.name;
            return (
              <button
                key={table.name}
                className={`tab-pill ${active ? "tab-pill-active" : ""}`}
                onClick={() => setActiveStatus(table.name)}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </button>
            );
          })}
        </div>

        <span className="hidden h-6 w-px bg-gray-blue-100 md:block" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center">
          <button
            className={`tab-pill ${showLogsTab ? "tab-pill-active" : ""}`}
            onClick={() => setActiveStatus(LOGS_TAB)}
          >
            Logs
          </button>
          {filingTab && (
            <button
              className={`tab-pill ${activeStatus === "filing" ? "tab-pill-active" : ""}`}
              onClick={() => setActiveStatus("filing")}
            >
              {filingTab.label || "Filing"}
            </button>
          )}
          {department === "reception" && (
            <button
              className={`tab-pill ${showNewBatchForm ? "tab-pill-active" : ""}`}
              onClick={() => setShowNewBatchForm((prev) => !prev)}
            >
              Add Batch
            </button>
          )}
        </div>

        <span className="hidden h-6 w-px bg-gray-blue-100 md:block" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center ml-auto">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="max-w-md" />
          <button
            className={`tab-pill ${filterType === "normal" ? "tab-pill-active" : ""}`}
            onClick={() => setFilterType("normal")}
          >
            Normal
          </button>
          <button
            className={`tab-pill ${filterType === "fu" ? "tab-pill-active" : ""}`}
            onClick={() => setFilterType("fu")}
          >
            Foreign & Urgent
          </button>
        </div>
      </div>

      {!config ? (
        <div>{department} doesn't exist</div>
      ) : loading ? (
        <div>Loading batches...</div>
      ) : showLogsTab ? (
        <div className="container-col-outer gap-4">
          <EntityNotesAndLogs
            department={department}
            batchType={normalizedBatchType}
            context="workflow"
            requireEntitySelection={false}
            initialShowLogs
            listMaxHeight={600}
            headerDescription={`Logs for ${department} (${filterType === "fu" ? "Foreign & Urgent" : "Normal"})`}
            title="Logs"
            allowedTypes={["log"]}
            enableLogToggle={false}
            allowNotesInput={false}
            includeNotes={false}
            searchTermOverride={searchTerm}
            onSearchTermChange={setSearchTerm}
            showSearchInput={false}
            onBatchNavigate={handleNavigateToBatch}
          />
        </div>
      ) : (
        <div className="tab-pill4">
          {department === "reception" && showNewBatchForm && (
            <NewBatch onBatchCreated={() => setShowNewBatchForm(false)} />
          )}
          <WorkflowTable
            columns={tableColumns}
            batches={visibleBatches.filter(b => b.status === activeStatus && b.current_department === department)}
            selectedBatch={selectedBatch}
            onSelect={setSelectedBatch}
            mainActions={mainActionsForTable}
            actions={dropdownActionsForTable}
            onExecute={executeAction}
            filterType={filterType}
            department={department}
            activeStatus={activeStatus}
            onBatchUpdate={handleReceptionUpdate}
            onArchiveDraft={handleArchiveDraft}
            clients={clients}
          />
        </div>
      )}
    </div>
  );
}






