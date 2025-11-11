// src/components/Workflow/ExpandedRowActions.jsx
import React from "react";

const ExpandedRowActions = ({ mainActions = [], actions = [], selectedBatch, onExecute = () => {}, onViewBatch = () => {} }) => {
  return (
    <div className="flex justify-between pt-4 mt-4 border-t border-gray-blue-200">
      {/* Left Side: View Batch Button */}
      <button
        type="button"
        className={`btn-class-dark min-w-[140px] text-white ${
          selectedBatch ? "bg-ebmaa-purple hover:bg-ebmaa-purple-light" : "bg-gray-blue-300 cursor-not-allowed"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          if (selectedBatch) onViewBatch(selectedBatch);
        }}
        disabled={!selectedBatch}
      >
        View Batch
      </button>

      {/* Right Side: Main Actions + Dropdown for Actions */}
      <div className="flex items-center gap-2">
        {/* Inline actions to the left of main action(s) */}
        {actions.length > 0 && actions.map((action) => (
          <button
            key={action.name}
            className="btn-class-dark bg-gray-500 text-white hover:bg-green-active min-w-[140px]"
            onClick={() => onExecute(action, selectedBatch)}
          >
            {action.label}
          </button>
        ))}

        {/* Main action(s) aligned to the far right of the group */}
        {mainActions.map((action) => (
          <button
            key={action.name}
            className="btn-class-dark bg-green-500 text-white hover:bg-green-active min-w-[140px]"
            onClick={() => onExecute(action, selectedBatch)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExpandedRowActions;
