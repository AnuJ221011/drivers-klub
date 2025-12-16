import Loader from './Loader';

export default function Button({
  children,
  className = '',
  type = 'button',
  onClick,
  disabled,
  loading,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400 ${className}`}
      {...rest}
    >
      {loading ? <Loader /> : null}
      <span>{children}</span>
    </button>
  );
}
