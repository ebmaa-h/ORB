// src/components/Workflow/WorkflowEngine.jsx
import React, { useEffect, useState, useMemo, useContext } from "react";
import WORKFLOW_CONFIG from "../../config/workflowConfig";
import ENDPOINTS from "../../utils/apiEndpoints";
import axiosClient from "../../utils/axiosClient";
import socket from "../../utils/socket";
import WorkflowTable from "./WorkflowTable";
import WorkflowActions from "./WorkflowActions";
import { UserContext } from "../../context/UserContext";
import { NewBatch } from "../index";

/**
 * Props:
 *  - department (string) e.g. "reception"
 *  - initialFilter (optional) 'all'|'normal'|'urgent'|'foreign'
 */
export default function WorkflowEngine({ department = "none" }) {
  const { user } = useContext(UserContext);
  const config = WORKFLOW_CONFIG[department];

  if (!config) return <div>{department}, doesnt exist</div>;

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('normal');
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Resolve endpoint string from ENDPOINTS using config.endpointKey
  const endpoint = ENDPOINTS[config.endpointKey];

  useEffect(() => {
    let mounted = true;

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(endpoint);
        if (!mounted) return;
        // normalize: attach `type` if not provided (assume normal)
        const normalized = (res.data || []).map((b) => ({
          ...b,
          type: b.total_urgent_foreign && b.total_urgent_foreign > 0 ? "foreign-urgent" : (b.type || "normal")
        }));

        setBatches(normalized);
      } catch (err) {
        console.error("WorkflowEngine fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInitial();

    // socket join room
    socket.connect();
    socket.emit("joinRoom", config.socketRoom);

    // event handlers
    const onCreated = (newBatch) => {
      setBatches((prev) => {
        // avoid duplicates
        if (prev.some((b) => b.batch_id === newBatch.batch_id)) return prev;
        return [...prev, newBatch];
      });
    };

    const onUpdated = (updated) => {
      setBatches((prev) => prev.map((b) => (b.batch_id === updated.batch_id ? {...b, ...updated} : b)));
    };

    const onMoved = (moved) => {
      // moved could mean department changed; remove if this department no longer relevant
      setBatches((prev) => {
        // If moved.current_department !== department, remove from this list
        if (moved.current_department && moved.current_department !== department) {
          return prev.filter((b) => b.batch_id !== moved.batch_id);
        }
        // otherwise update
        return prev.map((b) => (b.batch_id === moved.batch_id ? {...b, ...moved} : b));
      });
    };

    const onDeleted = (deleted) => {
      setBatches((prev) => prev.filter((b) => b.batch_id !== deleted.batch_id));
    };

    socket.on("batchCreated", onCreated);
    socket.on("batchUpdated", onUpdated);
    socket.on("batchMoved", onMoved);
    socket.on("batchDeleted", onDeleted);

    return () => {
      mounted = false;
      socket.off("batchCreated", onCreated);
      socket.off("batchUpdated", onUpdated);
      socket.off("batchMoved", onMoved);
      socket.off("batchDeleted", onDeleted);
      try {
        socket.emit("leaveRoom", config.socketRoom);
      } catch (e) {}
      // do not disconnect global socket if other parts still use it
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  // visible batches after filter
  const visibleBatches = useMemo(() => {
    if (filterType === "normal") return batches.filter(b => b.type === "normal");
    if (filterType === "foreign") return batches.filter(b => b.type === "foreign-urgent");
    return batches; // fallback
  }, [batches, filterType]);


  // action executor: config.actions define endpointKey + method
  const executeAction = async (action, batch) => {
    try {
      const epKey = action.endpointKey;
      const url = ENDPOINTS[epKey];
      if (!url) {
        console.error("Missing endpoint for action", action);
        return;
      }
      // optimistic: update UI quickly for UX
      // call backend
      const res = await axiosClient[action.method || "post"](url, { batch_id: batch.batch_id });
      // backend is expected to emit bus events; but also update local copy if returned
      if (res?.data) {
        // merge update if it returned updated batch
        setBatches((prev) => prev.map((b) => (b.batch_id === res.data.batch_id ? {...b, ...res.data} : b)));
      }
    } catch (err) {
      console.error("Action failed:", action, err);
    }
  };


  // Keep selectedBatch in sync if batch list changes
  useEffect(() => {
    if (!selectedBatch) return;

    // find the batch in the current batches (or visibleBatches)
    const updated = batches.find(b => b.batch_id === selectedBatch.batch_id);

    if (!updated) {
      // batch deleted or moved out of this department
      setSelectedBatch(null);
    } else if (updated !== selectedBatch) {
      // object reference changed, re-sync
      setSelectedBatch(updated);
    }
  }, [batches, selectedBatch]);


  return (
    <div className="container-col">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold">{department.toUpperCase()}</h2>

        <div className="ml-auto flex gap-2">
          <button className={`btn-class ${filterType === 'normal' ? 'font-bold' : ''}`} onClick={() => setFilterType('normal')}>Normal</button>
          <button className={`btn-class ${filterType === 'foreign' ? 'font-bold' : ''}`} onClick={() => setFilterType('foreign')}>Foreign & Urgent</button>
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
          {config.tables.map((table) => {
            const tableBatches = visibleBatches.filter(
              (b) => b.status === table.name && b.current_department === department
            );

            return (
              <div key={table.name} className="mb-6">
                <h3 className="text-lg font-semibold capitalize mb-2">{table.name}</h3>
                {tableBatches.length === 0 ? (
                  <div className="text-sm text-gray-500">No batches in {table.name}</div>
                ) : (
                  <WorkflowTable
                    columns={config.columns}
                    batches={tableBatches}
                    selectedBatch={selectedBatch}
                    onSelect={setSelectedBatch}
                  />
                )}
              </div>
            );
          })}

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
