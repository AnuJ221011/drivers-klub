import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Filter } from 'lucide-react';

import Table, { type Column } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getAdminTrips } from '../api/trip.api';
import type { TripEntity } from '../models/trip/trip';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const maybeAny = err as { response?: { data?: unknown } };
    const data = maybeAny.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      return String((data as Record<string, unknown>).message);
    }
  }
  return fallback;
}

export default function Trips() {
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<TripEntity[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchPickup, setSearchPickup] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  const refreshTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminTrips({ page: 1, limit: 50 });
      setTrips(data?.trips || []);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load trips'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTrips();
  }, [refreshTrips]);

  const filteredTrips = useMemo(() => {
    const pickupNeedle = (searchPickup || '').trim().toLowerCase();
    const statusNeedle = (searchStatus || '').trim().toUpperCase();

    return trips.filter((t) => {
      const pickupText = (t.pickupLocation || t.originCity || '').toLowerCase();
      const pickupOk = !pickupNeedle || pickupText.includes(pickupNeedle);
      const statusOk = !statusNeedle || (t.status || '').toUpperCase().includes(statusNeedle);
      return pickupOk && statusOk;
    });
  }, [trips, searchPickup, searchStatus]);

  const columns: Column<TripEntity>[] = [
    {
      key: 'index',
      label: 'S.No',
      render: (_, i) => i + 1,
    },
    {
      key: 'pickupLocation',
      label: 'Pickup',
      render: (t) => t.pickupLocation || t.originCity || '-',
    },
    {
      key: 'dropLocation',
      label: 'Drop',
      render: (t) => t.dropLocation || t.destinationCity || '-',
    },
    { key: 'status', label: 'Status' },
    {
      key: 'price',
      label: 'Fare',
      render: (t) => (t.price == null ? '-' : String(t.price)),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trips</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="md:hidden"
            onClick={() => setShowFilters((p) => !p)}
          >
            <Filter size={16} />
          </Button>
        </div>
      </div>

      <div
        className={`
          grid gap-4
          grid-cols-1 md:grid-cols-2
          ${showFilters ? 'block' : 'hidden md:grid'}
        `}
      >
        <Input
          placeholder="Search by pickup"
          value={searchPickup}
          onChange={(e) => setSearchPickup(e.target.value)}
        />
        <Input
          placeholder="Search by status"
          value={searchStatus}
          onChange={(e) => setSearchStatus(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading trips…</div>
      ) : (
        <Table columns={columns} data={filteredTrips} />
      )}
    </div>
  );
}