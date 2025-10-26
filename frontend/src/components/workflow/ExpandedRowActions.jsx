// src/components/Workflow/ExpandedRowActions.jsx
import React, { useState } from "react";

const ExpandedRowActions = ({ mainActions = [], actions = [], selectedBatch, onExecute = () => {}, onViewBatch = () => {} }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex justify-between items-center p-4 mt-4 border-t border-gray-blue-200">
      {/* Left Side: View Batch Button */}
      <button
        className="btn-class hover:bg-blue-600 min-w-[140px]"
        onClick={() => onViewBatch(selectedBatch)}
      >
        View Batch
      </button>

      {/* Right Side: Main Actions + Dropdown for Actions */}
      <div className="flex items-center gap-2">
        {mainActions.map((action) => (
          <button
            key={action.name}
            className="btn-class bg-green-500 text-white hover:bg-green-600 min-w-[140px]"
            onClick={() => onExecute(action, selectedBatch)}
          >
            {action.label}
          </button>
        ))}
        {actions.length > 0 && (
          <div className="relative">
            <button
              className="btn-class bg-gray-500 text-white hover:bg-gray-600 min-w-[140px]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              More Actions
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-blue-200 rounded shadow-lg z-10">
                {actions.map((action) => (
                  <button
                    key={action.name}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      onExecute(action, selectedBatch);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandedRowActions;