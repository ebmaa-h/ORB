import React, { useEffect, useState, useMemo, useContext } from "react";
import WORKFLOW_CONFIG from "../../config/workflowConfig";
import ENDPOINTS from "../../utils/apiEndpoints";
import axiosClient from "../../utils/axiosClient";
import socket from "../../utils/socket";
import WorkflowTable from "./WorkflowTable";
import WorkflowActions from "./WorkflowActions";
import { UserContext } from "../../context/UserContext";
import { NewBatch } from "../index";

export default function WorkflowEngine({ department = "none" }) {
  const { user } = useContext(UserContext);
  const config = WORKFLOW_CONFIG[department];

  if (!config) return <div>{department}, doesn't exist</div>;

  const [batches, setBatches] = useState([]);
  const [fuBatches, setFuBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("normal");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const endpoint = ENDPOINTS[config.endpointKey];

  // --- Fetch initial batches ---
  useEffect(() => {
    let mounted = true;

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(endpoint);
        if (!mounted) return;
        console.log('res.data', res.data);
        const { normal = [], foreignUrgent = [] } = res.data || {};
        setBatches(normal);
        setFuBatches(foreignUrgent);
      } catch (err) {
        console.error("WorkflowEngine fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInitial();

    return () => {
      mounted = false;
    };
  }, [department, endpoint]);

  // --- Socket setup ---
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
        console.log(`❌ batchCreated ignored: wrong department ${newBatch.current_department}`);
        return;
      }
      if (newBatch.parent_batch_id) { // foreignUrgent batch
        setFuBatches((prev) => {
          if (prev.some((b) => b.batch_id === newBatch.batch_id)) {
            console.log(`ℹ️ foreignUrgent batch ${newBatch.batch_id} already exists`);
            return prev;
          }
          console.log(`✅ Adding foreignUrgent batch ${newBatch.batch_id}`);
          return [...prev, newBatch];
        });
      } else { // normal batch
        setBatches((prev) => {
          if (prev.some((b) => b.batch_id === newBatch.batch_id)) {
            console.log(`ℹ️ normal batch ${newBatch.batch_id} already exists`);
            return prev;
          }
          console.log(`✅ Adding normal batch ${newBatch.batch_id}`);
          return [...prev, newBatch];
        });
      }
    };

    socket.on("batchCreated", handleCreated);

    // Test event to confirm socket connection
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
        console.warn("Failed to leave room:", e);
      }
    };
  }, [department]);

  // --- Filtered batches and columns ---
  const { visibleBatches, tableColumns } = useMemo(() => {
    const columns = filterType === "foreign" && config.foreignUrgentColumns
      ? config.foreignUrgentColumns
      : config.columns;
    const filtered = filterType === "normal" ? batches : fuBatches;
    return { visibleBatches: filtered, tableColumns: columns };
  }, [batches, fuBatches, filterType, config]);

  // --- Actions ---
  const executeAction = async (action, batch) => {
    try {
      const url = ENDPOINTS[action.endpointKey];
      if (!url) return console.error("Missing endpoint for action", action);
      const res = await axiosClient[action.method || "post"](url, { batch_id: batch.batch_id });
      if (res?.data) {
        if (batch.parent_batch_id) {
          setFuBatches((prev) =>
            prev.map((b) => (b.batch_id === res.data.batch_id ? { ...b, ...res.data } : b))
          );
        } else {
          setBatches((prev) =>
            prev.map((b) => (b.batch_id === res.data.batch_id ? { ...b, ...res.data } : b))
          );
        }
      }
    } catch (err) {
      console.error("Action failed:", action, err);
    }
  };

  // --- Keep selectedBatch in sync ---
  useEffect(() => {
    if (!selectedBatch) return;
    const updated = [...batches, ...fuBatches].find((b) => b.batch_id === selectedBatch.batch_id);
    if (!updated) setSelectedBatch(null);
    else if (updated !== selectedBatch) setSelectedBatch(updated);
  }, [batches, fuBatches, selectedBatch]);

  return (
    <div className="container-col">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold">{department.toUpperCase()}</h2>
        <div className="ml-auto flex gap-2">
          <button
            className={`btn-class ${filterType === "normal" ? "font-bold" : ""}`}
            onClick={() => setFilterType("normal")}
          >
            Normal
          </button>
          <button
            className={`btn-class ${filterType === "foreign" ? "font-bold" : ""}`}
            onClick={() => setFilterType("foreign")}
          >
            Foreign & Urgent
          </button>
        </div>
      </div>

      {department === "reception" && (
        <div className="rounded-md">
          <NewBatch />
        </div>
      )}

      {loading ? (
        <div>Loading batches...</div>
      ) : (
        <>
          {filterType === "normal" ? (
            config.tables.map((table) => {
              const tableBatches = visibleBatches.filter(
                (b) => b.status === table.name && b.current_department === department
              );
              console.log(`Table ${table.name} batches:`, tableBatches);
              return (
                <div key={table.name} className="mb-6">
                  <h3 className="text-lg font-semibold capitalize mb-2">{table.name}</h3>
                  {tableBatches.length === 0 ? (
                    <div className="text-sm text-gray-500">No batches in {table.name}</div>
                  ) : (
                    <WorkflowTable
                      columns={tableColumns}
                      batches={tableBatches}
                      selectedBatch={selectedBatch}
                      onSelect={setSelectedBatch}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="mb-6">
              <h3 className="text-lg font-semibold capitalize mb-2">Foreign & Urgent</h3>
              {visibleBatches.length === 0 ? (
                <div className="text-sm text-gray-500">No foreign/urgent batches</div>
              ) : (
                <WorkflowTable
                  columns={tableColumns}
                  batches={visibleBatches}
                  selectedBatch={selectedBatch}
                  onSelect={setSelectedBatch}
                />
              )}
            </div>
          )}
          <div className="mt-4">
            <WorkflowActions
              actions={config.actions}
              onExecute={(action, batch) => executeAction(action, batch)}
              selectedBatch={selectedBatch}
            />
          </div>
        </>
      )}
    </div>
  );
}