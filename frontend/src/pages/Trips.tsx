import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, Filter } from 'lucide-react';

import Table, { type Column } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/layout/Modal';
import AddTrip from '../components/trip/AddTrip';
import { getAdminTripsPage } from '../api/trip.api';
import type { TripEntity } from '../models/trip/trip';
import { useNavigate } from 'react-router-dom';

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
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<TripEntity[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchPickup, setSearchPickup] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalTrips, setTotalTrips] = useState<number | null>(null);
  const limit = 10;

  const refreshTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminTripsPage({ page, limit });
      setTrips(data.trips || []);
      setTotalTrips(typeof data.total === 'number' ? data.total : null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load trips'));
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    void refreshTrips();
  }, [refreshTrips]);

  const filteredTrips = useMemo(() => {
    const pickupNeedle = (searchPickup || '').trim().toLowerCase();
    const statusNeedle = (searchStatus || '').trim().toUpperCase();

    return trips.filter((t) => {
      const pickupValue = (t.pickupLocation || t.pickup || t.originCity || '').toString().toLowerCase();
      const pickupOk = !pickupNeedle || pickupValue.includes(pickupNeedle);
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
      key: 'pickup',
      label: 'Pickup',
      render: (t) => t.pickupLocation || t.pickup || t.originCity || '-',
    },
    {
      key: 'drop',
      label: 'Drop',
      render: (t) => t.dropLocation || t.drop || t.destinationCity || '-',
    },
    {
      key: 'originCity',
      label: 'Origin City',
      render: (t) => t.originCity || '-',
    },
    {
      key: 'destinationCity',
      label: 'Destination City',
      render: (t) => t.destinationCity || '-',
    },
    {
      key: 'distanceKm',
      label: 'Distance (km)',
      render: (t) => (t.distanceKm == null ? '-' : String(t.distanceKm)),
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (t) => t.providerMapping?.providerType || t.provider || '-',
    },
    { key: 'status', label: 'Status' },
    {
      key: 'fare',
      label: 'Fare',
      render: (t) => {
        const fare = t.price ?? t.fare;
        return fare == null ? '-' : String(fare);
      },
    },
    {
      key: 'tripType',
      label: 'Trip Type',
      render: (t) => t.tripType || '-',
    },
    {
      key: 'actions',
      label: 'Details',
      render: (t) => (
        <button
          type="button"
          onClick={() => nav(`/admin/trips/${t.id}`)}
          className="p-2 rounded hover:bg-yellow-100"
          aria-label="View trip details"
          title="View details"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  const totalPages = totalTrips != null ? Math.max(1, Math.ceil(totalTrips / limit)) : 1;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

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
          <Button onClick={() => setCreateOpen(true)}>+ Create Trip</Button>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Trip">
        <AddTrip
          onClose={() => setCreateOpen(false)}
          onCreated={() => void refreshTrips()}
        />
      </Modal>

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
        <div className="space-y-4">
          <Table columns={columns} data={filteredTrips} />
          <div className="flex items-center justify-between text-sm text-black/70">
            <div>
              Page {page} of {totalPages}
              {totalTrips != null ? ` • ${totalTrips} trips` : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={!canGoPrev || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={!canGoNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}