// src/components/Workflow/WorkflowActions.jsx
import React from "react";

export default function WorkflowActions({ actions = [], selectedBatch = null, onExecute = () => {} }) {
  if (!actions || actions.length === 0) {
    return <div className="text-sm text-gray-500">No actions configured for this workflow.</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.name}
          className="btn-class min-w-[140px]"
          onClick={() => {
            if (!selectedBatch) {
              // simple client-side guard, might replace with toast
              alert("Select a batch first (click a row).");
              return;
            }
            onExecute(action, selectedBatch);
          }}
        >
          {action.label}
        </button>
      ))}
      <div className="ml-4 text-sm text-gray-600">
        {selectedBatch ? `Selected: ${selectedBatch.batch_id}` : "No batch selected"}
      </div>
    </div>
  );
}
