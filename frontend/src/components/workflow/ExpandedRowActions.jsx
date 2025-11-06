// src/components/Workflow/ExpandedRowActions.jsx
import React from "react";

const ExpandedRowActions = ({ mainActions = [], actions = [], selectedBatch, onExecute = () => {}, onViewBatch = () => {} }) => {
  return (
    <div className="flex justify-between items-center p-4 mt-4 border-t border-gray-blue-200">
      {/* Left Side: View Batch Button */}
      <button
        className="btn-class hover:bg-blue-600 min-w-[140px] disabled"
        onClick={() => onViewBatch(selectedBatch)}
      >
        View Batch
      </button>

      {/* Right Side: Main Actions + Dropdown for Actions */}
      <div className="flex items-center gap-2">
        {/* Inline actions to the left of main action(s) */}
        {actions.length > 0 && actions.map((action) => (
          <button
            key={action.name}
            className="btn-class bg-gray-500 text-white hover:bg-gray-600 min-w-[140px]"
            onClick={() => onExecute(action, selectedBatch)}
          >
            {action.label}
          </button>
        ))}

        {/* Main action(s) aligned to the far right of the group */}
        {mainActions.map((action) => (
          <button
            key={action.name}
            className="btn-class bg-green-500 text-white hover:bg-green-600 min-w-[140px]"
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
