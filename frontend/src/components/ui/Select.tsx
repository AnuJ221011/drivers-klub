type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { label: string; value: string }[];
};

export default function Select({
  label,
  options,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-black">
          {label}
        </label>
      )}

      <select
        {...props}
        className={`
          w-full
          rounded-md
          border border-black/20
          px-3 py-2
          text-sm
          text-black
          bg-white
          focus:outline-none
          focus:ring-2
          focus:ring-yellow-400
          focus:border-yellow-400
          ${className}
        `}
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            className="bg-yellow-50 text-black"
          >
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
