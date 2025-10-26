// src/components/Workflow/Row.jsx
import React, { useState } from "react";
import ExpandedRowActions from "./ExpandedRowActions";

const Row = ({ batch, columns, onSelect, isSelected, mainActions, actions, onExecute, filterType, expandedColumns }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewBatch = (batch) => {
    console.log(`Navigating to edit page for batch ${batch.batch_id}`);
    // Example: useNavigate(`/batch/${batch.batch_id}/edit`);
  };

  return (
    <>
      <tr
        className={`border-b border-gray-blue-200 cursor-pointer hover:bg-gray-50 ${
          isSelected ? "bg-gray-200" : ""
        }`}
        onClick={() => {
          onSelect(batch);
          setIsExpanded(!isExpanded);
        }}
      >
        {columns.map((col) => {
          const raw = batch[col.name];
          const value = col.formatter ? col.formatter(raw, batch) : raw;

          if (col.name === "client_name") {
            return (
              <td key={col.name} className="px-2 py-1">
                {batch.client_first} {batch.client_last} <br />
                <span className="text-xs text-gray-500">{batch.client_type}</span>
              </td>
            );
          }

          return (
            <td key={col.name} className="px-2 py-1">
              {value ?? ""}
            </td>
          );
        })}
      </tr>
      {isExpanded && (
        <tr className="bg-gray-200 border border-gray-blue-200">
          <td colSpan={columns.length} className="px-2 py-2">
            <div className="grid grid-cols-6 gap-4">
              {expandedColumns.map((col) => {
                const raw = batch[col.name];
                const value = col.formatter ? col.formatter(raw, batch) : raw;
                return (
                  <div key={col.name} className="text-sm">
                    <span className="font-semibold">{col.label}:</span> {value ?? "N/A"}
                  </div>
                );
              })}
            </div>
            <ExpandedRowActions
              mainActions={mainActions}
              actions={actions}
              selectedBatch={batch}
              onExecute={onExecute}
              onViewBatch={handleViewBatch}
            />
          </td>
        </tr>
      )}
    </>
  );
};

export default Row;