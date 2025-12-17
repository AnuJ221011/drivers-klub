import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  maxLength,
  disabled,
  className = '',
  ...rest
  },
  ref,
) {
  return (
    <label className={`block ${className}`} htmlFor={id}>
      {label ? (
        <div className="mb-1 text-sm font-medium text-gray-700">{label}</div>
      ) : null}
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-gray-50"
        {...rest}
      />
    </label>
  );
});

export default Input;