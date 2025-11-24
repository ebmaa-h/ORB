import React from "react";

const ConfirmDialog = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border border-gray-blue-100 bg-white shadow-lg">
        <div className="border-b border-gray-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">Please Confirm</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-800">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-blue-50">
          <button type="button" className="button-pill transition-colors duration-150 hover:border-ebmaa-purple hover:text-ebmaa-purple" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="tab-pill text-white px-4 bg-ebmaa-purple border border-ebmaa-purple transition-colors duration-150 hover:bg-white hover:text-ebmaa-purple"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
