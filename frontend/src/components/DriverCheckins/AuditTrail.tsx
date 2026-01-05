import { useState } from "react";

export default function AuditTrail({ logs }: { logs?: any[] }) {
  // Simple collapsible view so the page isn't noisy by default.
  const [open, setOpen] = useState(false);
  if (!logs?.length) return null;

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className="text-sm text-yellow-600 font-medium"
      >
        {open ? "Hide Audit Trail" : "Show Audit Trail"}
      </button>

      {open && (
        <ul className="mt-3 space-y-2 text-sm">
          {logs.map((l, i) => (
            <li key={i} className="border-l-2 pl-3">
              <div>{l.action}</div>
              <div className="text-black/60">
                {l.by} • {l.at}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
