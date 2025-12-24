import { useMemo } from 'react';
import Table, { type Column } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { useFleet } from '../context/FleetContext';
import type { Fleet } from '../models/fleet/fleet';

export default function FleetsPage() {
  const { fleets, fleetsLoading, activeFleetId, setActiveFleetId } = useFleet();

  const columns: Column<Fleet>[] = useMemo(
    () => [
      { key: 'name', label: 'Fleet Name' },
      { key: 'city', label: 'City' },
      { key: 'mobile', label: 'Mobile' },
      {
        key: 'status',
        label: 'Status',
        render: (f) => (
          <span
            className={`px-2 py-1 rounded text-xs ${
              f.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {f.status}
          </span>
        ),
      },
      {
        key: 'action',
        label: 'Action',
        render: (f) => (
          <Button
            variant={f.id === activeFleetId ? 'secondary' : 'primary'}
            onClick={() => setActiveFleetId(f.id)}
          >
            {f.id === activeFleetId ? 'Selected' : 'Select'}
          </Button>
        ),
      },
    ],
    [activeFleetId, setActiveFleetId],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fleets</h1>
      </div>

      {fleetsLoading ? (
        <div className="text-sm text-black/60">Loading fleets…</div>
      ) : (
        <Table columns={columns} data={fleets || []} />
      )}
    </div>
  );
}

