// src/components/Workflow/WorkflowEngine.jsx
import React, { useEffect, useState, useMemo, useContext, useCallback } from "react";
import WORKFLOW_CONFIG from "../../config/workflowConfig";
import ENDPOINTS from "../../utils/apiEndpoints";
import axiosClient from "../../utils/axiosClient";
import socket from "../../utils/socket";
import WorkflowTable from "./WorkflowTable";
import { UserContext } from "../../context/UserContext";
import { NewBatch, NotesAndLogs } from "../index";
import SearchBar from "../ui/SearchBar";

export default function WorkflowEngine({ department = "none" }) {
  const { user } = useContext(UserContext);
  const config = WORKFLOW_CONFIG[department];
  const [batches, setBatches] = useState([]);
  const [fuBatches, setFuBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("normal");
  const [activeStatus, setActiveStatus] = useState("current");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const endpoint = config?.endpointKey ? ENDPOINTS[config.endpointKey] : null;

  // fetch initial batches
  useEffect(() => {
    let mounted = true;

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(endpoint);
        if (!mounted) return;
        console.log(`📥 Fetch response for ${department}:`, res.data);
        const { normal = [], foreignUrgent = [] } = res.data || {};
        setBatches(normal.filter(b => !b.is_pure_foreign_urgent && b.current_department === department));
        setFuBatches(foreignUrgent.filter(b => b.current_department === department));
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

  // web sockets
  useEffect(() => {
    if (!socket.connected) {
      console.log('🔌 Connecting socket...');
      socket.connect();
    }

    socket.emit("joinRoom", department);
    console.log(`🔗 Emitted joinRoom for ${department}`);

    const logBatch = (prefix, batch) =>
      console.log(`🟢 ${prefix} received for dept ${department}:`, batch);

    const handleCreated = (newBatch) => {
      logBatch("batchCreated", newBatch);
      if (!newBatch.current_department || newBatch.current_department !== department) {
        console.log(`❌ batchCreated ignored: wrong department ${newBatch.current_department} for ${department}`);
        return;
      }
      if (newBatch.parent_batch_id) { // foreignUrgent batch
        setFuBatches((prev) => {
          if (prev.some(b => b.batch_id === newBatch.batch_id)) {
            console.log(`ℹ️ foreignUrgent batch ${newBatch.batch_id} already exists`);
            return prev;
          }
          console.log(`✅ Adding foreignUrgent batch ${newBatch.batch_id}`);
          return [...prev, newBatch];
        });
      } else if (!newBatch.is_pure_foreign_urgent) { // normal batch
        setBatches((prev) => {
          if (prev.some(b => b.batch_id === newBatch.batch_id)) {
            console.log(`ℹ️ normal batch ${newBatch.batch_id} already exists`);
            return prev;
          }
          console.log(`✅ Adding normal batch ${newBatch.batch_id}`);
          return [...prev, newBatch];
        });
      } else {
        console.log(`ℹ️ Skipping dummy pure foreign/urgent batch ${newBatch.batch_id}`);
      }
    };

    socket.on("batchCreated", handleCreated);

    const handleUpdated = (updated) => {
      applyBatchUpdate(updated);
    };

    socket.on("batchUpdated", handleUpdated);

    socket.on("test", (data) => {
      console.log('🔔 Test event received:', data);
    });

    return () => {
      socket.off("batchCreated", handleCreated);
      socket.off("batchUpdated", handleUpdated);
      socket.off("test");
      try {
        socket.emit("leaveRoom", department);
        console.log(`🔗 Emitted leaveRoom for ${department}`);
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
    if (activeStatus === "inbox") return config.inboxActions || [];
    if (activeStatus === "outbox") return config.outboxActions || [];
    if (activeStatus === "filing" && config.filingActions) return config.filingActions;
    return config.expandedActionsMain || config.mainActions || [];
  }, [activeStatus, config]);

  const dropdownActionsForTable = useMemo(() => {
    if (!config) return [];
    if (activeStatus === "inbox" || activeStatus === "outbox") return [];
    return config.expandedActions || config.actions || [];
  }, [activeStatus, config]);

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
      <div className="container-row-outer justify-between w-full">
        <div className="flex gap-2 items-center">
          {(config?.tables || []).map((table) => (
            <button
              key={table.name}
              className={`btn-class ${activeStatus === table.name ? "font-bold bg-gray-100" : ""}`}
              onClick={() => setActiveStatus(table.name)}
            >
              {table.name.charAt(0).toUpperCase() + table.name.slice(1)}
            </button>
          ))}
          {department === "reception" && (
            <button
              className={`btn-class ${activeStatus === "newBatch" ? "font-bold bg-gray-100" : ""}`}
              onClick={() => setActiveStatus("newBatch")}
            >
              Add Batch
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex gap-2">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="max-w-md" />
          </div>
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
      ) : (
        <div className="container-col-outer gap-4">
          {activeStatus === "newBatch" && department === "reception" ? (
            <NewBatch setActiveStatus={setActiveStatus} />
          ) : (
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
            />
          )}
          <NotesAndLogs department={department} filterType={filterType} />
        </div>
      )}
    </div>
  );
}

