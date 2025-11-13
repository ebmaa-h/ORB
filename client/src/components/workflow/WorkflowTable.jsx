// src/components/Workflow/WorkflowTable.jsx
import React, { useCallback, useEffect, useState } from "react";
import Row from "./Row";
import WORKFLOW_CONFIG from "../../config/workflowConfig";

const WorkflowTable = React.memo(function WorkflowTable({
  columns = [],
  batches = [],
  selectedBatch = null,
  onSelect = () => {},
  mainActions = [],
  actions = [],
  onExecute = () => {},
  filterType = "normal",
  department = "none",
  activeStatus = "current",
  onBatchUpdate = async () => ({ success: false }),
  onArchiveDraft = async () => ({ success: false }),
  clients = [],
}) {
  if (!Array.isArray(batches)) batches = [];

  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const handleToggleExpand = useCallback(
    (batchId) => {
      setExpandedBatchId((prev) => (prev === batchId ? null : batchId));
    },
    [],
  );

  const config = WORKFLOW_CONFIG[department];
  const expandedColumns = filterType === "fu" && config.foreignUrgentColumnsExpanded
    ? config.foreignUrgentColumnsExpanded
    : config.columnsExpanded;
  const canEdit = activeStatus === "current";

  useEffect(() => {
    setExpandedBatchId(null);
  }, [activeStatus, filterType, department]);

  return (
    <div className="overflow-x-auto rounded border border-gray-blue-200 p-2 bg-white">
      <table className="table-auto w-full border-collapse text-sm">
        <thead className="bg-gray-blue-50/60">
          <tr className="text-left border-b border-gray-blue-200 text-gray-blue-600 uppercase text-xs tracking-wide">
            {columns.map((col) => (
              <th key={col.name} className="px-2 py-2 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batches.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="pt-4 text-md text-center text-gray-blue-600">
                No batches
              </td>
            </tr>
          ) : (
            batches.map((batch) => (
              <Row
                key={batch.batch_id}
                batch={batch}
                columns={columns}
                onSelect={onSelect}
                onToggleExpand={handleToggleExpand}
                isSelected={selectedBatch?.batch_id === batch.batch_id}
                isExpanded={expandedBatchId === batch.batch_id}
                mainActions={mainActions}
                actions={actions}
                onExecute={onExecute}
                filterType={filterType}
                expandedColumns={expandedColumns}
                canEdit={canEdit}
                onBatchUpdate={onBatchUpdate}
                onArchiveDraft={onArchiveDraft}
                clients={clients}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

export default WorkflowTable;
