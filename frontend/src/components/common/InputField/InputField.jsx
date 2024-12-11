/* eslint-disable react/prop-types */

export default function InputField({ value, label, id, onChange, readOnly = false }) {
  return (
    <div className='border-b flex-1'>
      <label htmlFor={id || label.toLowerCase()} className="font-bold">
        {label}:
      </label>
      <input
        type="text"
        id={id || label.toLowerCase()}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className="w-full h-[30px]"
      />
    </div>
  );
}
