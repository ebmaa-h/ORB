import React from "react";

export default function Popup({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded shadow-lg p-4 min-w-[300px] max-w-[600px] relative ">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-dark"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}
