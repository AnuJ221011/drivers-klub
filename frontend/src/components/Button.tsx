import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import Loader from './Loader';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
  }
>;

export default function Button({
  children,
  className = '',
  type = 'button',
  disabled,
  loading,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400 ${className}`}
      {...rest}
    >
      {loading ? <Loader /> : null}
      <span>{children}</span>
    </button>
  );
}
