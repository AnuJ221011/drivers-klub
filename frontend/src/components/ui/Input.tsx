import React from "react";

export type InputProps =
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    helperText?: React.ReactNode;
  };

export default function Input({
  label,
  helperText,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-black">
          {label}
        </label>
      )}

      <input
        {...props}
        className={`
          w-full rounded-md
          border border-black/20
          px-3 py-2
          text-sm text-black
          placeholder:text-black/40
          focus:outline-none
          focus:ring-2 focus:ring-yellow-400
          focus:border-yellow-400
          ${className}
        `}
      />

      {helperText ? (
        <div className="text-xs text-black/60">{helperText}</div>
      ) : null}
    </div>
  );
}

