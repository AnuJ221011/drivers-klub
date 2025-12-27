type Tab = "HUBS" | "DRIVERS" | "VEHICLES" | "MANAGERS";

type Props = {
  value: Tab;
  onChange: (v: Tab) => void;
};

export default function FleetTabs({ value, onChange }: Props) {
  const tabs: Tab[] = ["HUBS", "DRIVERS", "VEHICLES", "MANAGERS"];

  return (
    <div className="flex gap-2 border-b border-black/10">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition
            ${
              value === t
                ? "border-yellow-400 text-black"
                : "border-transparent text-black/60 hover:text-black"
            }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
