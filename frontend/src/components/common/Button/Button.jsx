import PropTypes from 'prop-types'; // For prop type validation
import './button.css';

export default function Button({ btnName, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`border py-1 px-1 border-gray-light min-w-[100px] rounded ${className}`}
      aria-label={btnName} // Accessibility
    >
      {btnName}
    </button>
  );
}

// // Prop types for validation
// Button.propTypes = {
//   btnName: PropTypes.string.isRequired,
//   onClick: PropTypes.func,
//   type: PropTypes.oneOf(['button', 'submit', 'reset']),
//   className: PropTypes.string,
// };

// // Default props
// Button.defaultProps = {
//   onClick: () => {},
//   type: 'button',
//   className: '',
// };