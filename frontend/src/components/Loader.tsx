type LoaderProps = {
  className?: string;
};

export default function Loader({ className = '' }: LoaderProps) {
  return (
    <div
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white ${className}`}
      aria-label="Loading"
      role="status"
    />
  );
}
