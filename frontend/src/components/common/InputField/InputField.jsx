/* eslint-disable react/prop-types */

export default function InputField({ type, value, label, id, onChange, readOnly = false }) {
  return (
    <div className='border-b border-gray-light'>
      <label htmlFor={id || label.toLowerCase()} className="font-bold text-sm">
        {label}:
      </label>
      <input
        type={type || 'text'}
        id={id || label.toLowerCase()}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className="w-full h-[30px] text-sm"
      />
    </div>
  );
}
