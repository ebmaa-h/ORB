import React from "react";
import { useEffect } from "react";

const Row = ({ batch, columns, onSelect, isSelected }) => (
  <tr
    className={`border-b border-gray-blue-200 cursor-pointer hover:bg-gray-50 ${
      isSelected ? "bg-gray-200" : ""
    }`}
    onClick={() => onSelect(batch)}
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
);

const WorkflowTable = React.memo(function WorkflowTable({
  columns = [],
  batches = [],
  selectedBatch = null,
  onSelect = () => {},
}) {
  if (!Array.isArray(batches)) batches = [];

  return (
    <div className="overflow-x-auto rounded border border-gray-blue-200 p-2">
      <table className="table-auto w-full border-collapse text-gray-dark text-sm">
        <thead>
          <tr className="text-left border-b border-gray-blue-200">
            {columns.map((col) => (
              <th key={col.name} className="px-2 py-1">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batches.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="pt-2 text-md text-gray-500 text-center">
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
                isSelected={selectedBatch?.batch_id === batch.batch_id}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

export default WorkflowTable;