import React, { useMemo } from "react";

type Props = {
  id?: string;
  label?: string;
  value: string; // digits only (recommended), but we will sanitize anyway
  onChange: (digitsOnly: string) => void;
  disabled?: boolean;
  placeholder?: string;

  /** Default: +91 */
  countryCode?: string;
  /** Default: 10 */
  requiredDigits?: number;

  /** Optional class overrides (useful for Login page styling) */
  wrapperClassName?: string;
  labelClassName?: string;
  prefixClassName?: string;
  inputClassName?: string;
  helperClassName?: string;
};

function digitsOnly(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export default function PhoneInput({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder = "9876543210",
  countryCode = "+91",
  requiredDigits = 10,
  wrapperClassName = "",
  labelClassName = "text-sm font-medium text-black",
  prefixClassName = "px-3 py-2 text-sm text-black/70 bg-yellow-50 border border-black/20 rounded-l-md",
  inputClassName = "",
  helperClassName = "text-xs",
}: Props) {
  const digits = useMemo(() => digitsOnly(value), [value]);
  const exceededBy = Math.max(0, digits.length - requiredDigits);
  const remaining = Math.max(0, requiredDigits - digits.length);
  const isExceeded = exceededBy > 0;

  const helper = useMemo(() => {
    if (digits.length === 0) return `Enter ${requiredDigits}-digit mobile number`;
    if (isExceeded) return `Exceeded by ${exceededBy} digit${exceededBy === 1 ? "" : "s"}`;
    if (remaining > 0) return `Enter ${remaining} more digit${remaining === 1 ? "" : "s"}`;
    return "Mobile number complete";
  }, [digits.length, requiredDigits, isExceeded, exceededBy, remaining]);

  const defaultInputClasses =
    "w-full rounded-r-md border px-3 py-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2";

  const okBorder = "border-black/20 focus:ring-yellow-400 focus:border-yellow-400";
  const badBorder = "border-red-500 focus:ring-red-400 focus:border-red-500";

  const inputClasses = `${defaultInputClasses} ${isExceeded ? badBorder : okBorder} ${inputClassName}`;
  const helperColor = isExceeded ? "text-red-600" : "text-black/60";

  return (
    <div className={`space-y-1 ${wrapperClassName}`}>
      {label ? <label className={labelClassName}>{label}</label> : null}

      <div className="flex">
        <div className={prefixClassName}>{countryCode}</div>
        <input
          id={id}
          value={digits}
          onChange={(e) => onChange(digitsOnly(e.target.value))}
          inputMode="numeric"
          pattern="\d*"
          autoComplete="tel-national"
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={isExceeded}
        />
      </div>

      <div className={`${helperClassName} ${helperColor}`}>{helper}</div>
    </div>
  );
}

