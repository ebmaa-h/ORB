// src/components/Workflow/WorkflowEngine.jsx
import React, { useEffect, useState, useMemo, useContext } from "react";
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

  if (!config) return <div>{department} doesn't exist</div>;

  const [batches, setBatches] = useState([]);
  const [fuBatches, setFuBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("normal");
  const [activeStatus, setActiveStatus] = useState("current");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const endpoint = ENDPOINTS[config.endpointKey];

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

    fetchInitial();

    return () => {
      mounted = false;
    };
  }, [department, endpoint]);

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

    socket.on("test", (data) => {
      console.log('🔔 Test event received:', data);
    });

    return () => {
      socket.off("batchCreated", handleCreated);
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
    const columns = filterType === "fu" && config.foreignUrgentColumns
      ? config.foreignUrgentColumns
      : config.columns;
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

  // actions
  const executeAction = async (action, batch) => {
    try {
      if (batch.is_pure_foreign_urgent && !batch.parent_batch_id) {
        console.log(`Skipping action for pure foreign/urgent batch ${batch.batch_id}`);
        return;
      }
      const url = ENDPOINTS[action.endpointKey];
      if (!url) return console.error("Missing endpoint for action", action);
      const res = await axiosClient[action.method || "post"](url, { batch_id: batch.batch_id });
      if (res?.data) {
        console.log(`Action response for ${action.name}:`, res.data);
        if (batch.parent_batch_id) {
          setFuBatches((prev) =>
            prev.map(b => (b.batch_id === res.data.batch_id ? { ...b, ...res.data } : b))
          );
        } else {
          setBatches((prev) =>
            prev.map(b => (b.batch_id === res.data.batch_id ? { ...b, ...res.data } : b))
          );
        }
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
          {config.tables.map((table) => (
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

      {loading ? (
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
              mainActions={config.mainActions || []}
              actions={config.actions || []}
              onExecute={executeAction}
              filterType={filterType}
              department={department}
            />
          )}
          <NotesAndLogs />
        </div>
      )}
    </div>
  );
}