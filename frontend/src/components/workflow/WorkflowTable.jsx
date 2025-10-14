// src/components/Workflow/WorkflowTable.jsx
import React from "react";

const Row = ({ batch, columns, onSelect }) => (
  <tr className="border-b border-gray-blue-100 hover:bg-gray-50 cursor-pointer" onClick={() => onSelect(batch)}>
    {columns.map((col) => {
      const raw = batch[col.name];
      const value = col.formatter ? col.formatter(raw, batch) : raw;
      // special: client name composition
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
);

const WorkflowTable = React.memo(function WorkflowTable({ columns = [], batches = [], onSelect = () => {} }) {
  if (!Array.isArray(batches)) batches = [];

  return (
    <div className="overflow-x-auto rounded border border-gray-blue-100 p-2">
      {batches.length === 0 ? (
        <p className="text-sm text-gray-500">No batches</p>
      ) : (
        <table className="table-auto w-full border-collapse text-gray-dark text-sm">
          <thead>
            <tr className="text-left border-b border-gray-blue-100">
              {columns.map((col) => (
                <th key={col.name} className="px-2 py-1">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <Row key={batch.batch_id} batch={batch} columns={columns} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

export default WorkflowTable;
