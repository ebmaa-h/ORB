/* eslint-disable react/prop-types */
import React from "react";
import NewBatch from "./NewBatch";

// Memoized table, only re-renders if props change
const BatchTable = React.memo(function BatchTable({ title, batches }) {
  console.log(`🧠 Rendering ${title} table`);
  return (
    <div className="container-col w-[50%]">
      <h3 className="font-bold mb-2">{title}</h3>
      {batches.length === 0 ? (
        <p className="text-sm text-gray-500">No batches</p>
      ) : (
        <table className="table-auto w-full border-collapse border-y border-gray-blue-100 text-gray-dark text-sm">
          <thead>
            <tr className="text-left border-b border-gray-blue-100">
              <th className="px-2 py-1">Batch ID</th>
              <th className="px-2 py-1">Client</th>
              <th className="px-2 py-1">Size</th>
              <th className="px-2 py-1">Created By</th>
              <th className="px-2 py-1">Date</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.batch_id} className="border-b border-gray-blue-50">
                <td className="px-2 py-1">{batch.batch_id}</td>
                <td className="px-2 py-1">
                  {batch.client_first} {batch.client_last} <br />
                  <span className="text-xs text-gray-500">
                    {batch.client_type}
                  </span>
                </td>
                <td className="px-2 py-1">{batch.batch_size}</td>
                <td className="px-2 py-1">{batch.created_by_email}</td>
                <td className="px-2 py-1">
                  {new Date(batch.date_received).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

export default function ReceptionWorkflow({ batches }) {
  // categorize batches
  const filingBatches = batches.filter(
    (b) => b.current_department === "filling"
  );
  const outboxBatches = batches.filter((b) => b.current_stage === "outbox");
  const inProgressBatches = batches.filter(
    (b) => b.current_stage === "current" && b.current_department === "reception"
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 👇 Create new batch */}
      <NewBatch />

      {/* 👇 Batches organized by category */}
      <div className="flex flex-row gap-4">
        <BatchTable title="Filing" batches={filingBatches} />
        <BatchTable title="Outbox" batches={outboxBatches} />
      </div>

      <BatchTable title="In Progress" batches={inProgressBatches} />

      {/* Notes & Logs */}
    </div>
  );
}
