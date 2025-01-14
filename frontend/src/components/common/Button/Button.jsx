import PropTypes from 'prop-types'; // For prop type validation
import './button.css';

export default function Button({ btnName, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`text-sm py-1 px-2 mx-2 min-w-[100px] rounded hover:bg-ebmaa-purple hover:border-white hover:text-white transition duration-10 text-center`}
      aria-label={btnName} // Accessibility
    >
      {btnName}
    </button>
  );
}
