import PropTypes from 'prop-types'; // For prop type validation
import './button.css';

export default function Button({ btnName, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`border py-1 px-1 border-gray-light min-w-[100px] rounded ${className} hover:bg-gray-light hover:border-white transition duration-200`}
      aria-label={btnName} // Accessibility
    >
      {btnName}
    </button>
  );
}
