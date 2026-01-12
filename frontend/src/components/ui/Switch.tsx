import React from 'react';

type SwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
};

export default function Switch({
  checked,
  disabled,
  onChange,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      className={[
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-yellow-400' : 'bg-black/20',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-yellow-400',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
}

