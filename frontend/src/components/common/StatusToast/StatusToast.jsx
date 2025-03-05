import React, { useEffect } from 'react';

const StatusToast = ({ isSuccess, message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      role="alert"
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg text-white transition-opacity duration-300 ${
        isSuccess ? 'bg-green-500' : 'bg-red-500'
      } ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white font-bold">
        ✕
      </button>
    </div>
  );
};

export default StatusToast;
