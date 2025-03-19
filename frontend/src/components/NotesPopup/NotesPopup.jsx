import { useRef } from 'react';
import { Notes } from '../../components';

export default function NotesPopup({ tableName, id, onClose }) {
  const modalRef = useRef(null);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose} // Click outside closes modal
    >
      <div 
        ref={modalRef} 
        className="bg-white p-6 rounded-lg shadow-lg w-[1200px] relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>
        <Notes tableName={tableName} id={id} />
      </div>
    </div>
  );
}
