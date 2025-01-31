/* eslint-disable react/prop-types */

export default function InputField({ classes, type, value, label, id, onChange, readOnly = false }) {
  return (
    <div className="flex items-end gap-4 ">
      {label && (
        <label htmlFor={id || label.toLowerCase()} className=" whitespace-nowrap">
          {label}:
        </label>
      )}
      <input
        type={type || 'text'}
        id={id || label.toLowerCase()}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`${classes || ''} border-gray-light border-b focus:outline-none focus:ring-0 focus:border-b-1 w-full`}

      />
    </div>
  );
}
