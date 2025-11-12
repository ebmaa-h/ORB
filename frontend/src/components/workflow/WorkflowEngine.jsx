// src/components/Workflow/WorkflowEngine.jsx
import React, { useEffect, useState, useMemo, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

export default function WorkflowEngine({ department = "none" }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
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
  const handleNavigateToBatch = useCallback(
    (batchId) => {
      if (batchId === null || batchId === undefined) return false;
      const normalizedId = String(batchId).trim();
      if (!normalizedId) return false;
      const allBatches = [...batches, ...fuBatches];
      const found = allBatches.find((entry) => String(entry.batch_id) === normalizedId);
      if (found) {
        navigate(`/batches/${found.batch_id}`, { state: { batch: found } });
        return true;
      }
      navigate(`/batches/${normalizedId}`);
      return true;
    },
    [batches, fuBatches, navigate],
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
        setBatches(normal.filter(b => !b.is_pure_foreign_urgent && b.current_department === department));
        setFuBatches(foreignUrgent.filter(b => b.current_department === department));
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

  const applyBatchUpdate = useCallback((updated) => {
    if (!updated || !updated.batch_id) return;
    const isFU = !!updated.parent_batch_id;
    const appliesToDept = updated.current_department === department;

    if (isFU) {
      setFuBatches((prev) => {
        const exists = prev.some((b) => b.batch_id === updated.batch_id);
        if (!appliesToDept) {
          return prev.filter((b) => b.batch_id !== updated.batch_id);
        }
        if (exists) {
          return prev.map((b) => (b.batch_id === updated.batch_id ? { ...b, ...updated } : b));
        }
        return [...prev, updated];
      });
    } else {
      setBatches((prev) => {
        const exists = prev.some((b) => b.batch_id === updated.batch_id);
        if (!appliesToDept) {
          return prev.filter((b) => b.batch_id !== updated.batch_id);
        }
        if (exists) {
          return prev.map((b) => (b.batch_id === updated.batch_id ? { ...b, ...updated } : b));
        }
        return [...prev, updated];
      });
    }
  }, [department]);

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
          batch_id: batch.batch_id,
          is_fu: !!batch.parent_batch_id,
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
      const normalized = normalizeIncomingBatch(newBatch);
      logBatch('batchCreated', normalized);
      if (!normalized.current_department || normalized.current_department !== department) {
        console.log(`[socket] batchCreated ignored: wrong department ${normalized.current_department} for ${department}`);
        return;
      }
      if (normalized.parent_batch_id) { // foreignUrgent batch
        setFuBatches((prev) => {
          if (prev.some((b) => b.batch_id === normalized.batch_id)) {
            console.log(`[socket] foreign urgent batch ${normalized.batch_id} already exists`);
            return prev;
          }
          console.log(`[socket] adding foreign urgent batch ${normalized.batch_id}`);
          return [normalized, ...prev];
        });
      } else if (!normalized.is_pure_foreign_urgent) { // normal batch
        setBatches((prev) => {
          if (prev.some((b) => b.batch_id === normalized.batch_id)) {
            console.log(`[socket] normal batch ${normalized.batch_id} already exists`);
            return prev;
          }
          console.log(`[socket] adding normal batch ${normalized.batch_id}`);
          return [normalized, ...prev];
        });
      } else {
        console.log(`[socket] skipping pure foreign urgent batch ${normalized.batch_id}`);
      }
    };

    socket.on("batchCreated", handleCreated);

    const handleUpdated = (updated) => {
      applyBatchUpdate(updated);
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
          String(batch.batch_id || "").toLowerCase().includes(searchLower) ||
          String(batch.client_id || "").toLowerCase().includes(searchLower) ||
          String(batch.created_by || "").toLowerCase().includes(searchLower) ||
          String(batch.client_first || "").toLowerCase().includes(searchLower) ||
          String(batch.client_last || "").toLowerCase().includes(searchLower)
        );
      } else {
        return (
          String(batch.batch_id || "").toLowerCase().includes(searchLower) ||
          String(batch.parent_batch_id || "").toLowerCase().includes(searchLower) ||
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
        console.log(`Skipping action for pure foreign/urgent batch ${batch.batch_id}`);
        return;
      }
      const url = ENDPOINTS[action.endpointKey];
      if (!url) return console.error("Missing endpoint for action", action);
      const payload = { batch_id: batch.batch_id, is_fu: !!batch.parent_batch_id, user_id: user?.user_id };
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
          if (payload.batch_id) applyBatchUpdate(payload);
          if (payload.inbox?.batch_id) applyBatchUpdate(payload.inbox);
          if (payload.outbox?.batch_id) applyBatchUpdate(payload.outbox);
          if (payload.filing?.batch_id) applyBatchUpdate(payload.filing);
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
    const updated = [...batches, ...fuBatches].find(b => b.batch_id === selectedBatch.batch_id);
    if (!updated) setSelectedBatch(null);
    else if (updated !== selectedBatch) setSelectedBatch(updated);
  }, [batches, fuBatches, selectedBatch]);

  return (
    <div className="">
      <div className="container-row-outer w-full flex-wrap gap-4 items-center">
        <div className="flex gap-2 flex-wrap items-center">
          {statusTabs.map((table) => {
            const label = table.label || table.name;
            return (
              <button
                key={table.name}
                className={`btn-class ${activeStatus === table.name ? "font-bold bg-gray-100" : ""}`}
                onClick={() => setActiveStatus(table.name)}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </button>
            );
          })}
        </div>

        <span className="text-gray-400 select-none">|</span>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            className={`btn-class ${showLogsTab ? "font-bold bg-gray-100" : ""}`}
            onClick={() => setActiveStatus(LOGS_TAB)}
          >
            Logs
          </button>
          {filingTab && (
            <button
              className={`btn-class ${activeStatus === "filing" ? "font-bold bg-gray-100" : ""}`}
              onClick={() => setActiveStatus("filing")}
            >
              {filingTab.label || "Filing"}
            </button>
          )}
          {department === "reception" && (
            <button
              className={`btn-class ${showNewBatchForm ? "font-bold bg-gray-100" : ""}`}
              onClick={() => setShowNewBatchForm((prev) => !prev)}
            >
              Add Batch
            </button>
          )}
        </div>

        <span className="text-gray-400 select-none">|</span>

        <div className="flex gap-2 flex-wrap items-center ml-auto">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="max-w-md" />
          <button
            className={`btn-class ${filterType === "normal" ? "font-bold bg-gray-100" : ""}`}
            onClick={() => setFilterType("normal")}
          >
            Normal
          </button>
          <button
            className={`btn-class ${filterType === "fu" ? "font-bold bg-gray-100" : ""}`}
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
        <div className="container-col-outer gap-4">
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






