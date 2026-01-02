import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Table, { type Column } from '../components/ui/Table';
import Modal from '../components/layout/Modal';
import AddTrip from '../components/trip/AddTrip';

import { getAdminTripsPage } from '../api/trip.api';
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

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function fmtDateTime(value?: string | null): string {
  const d = parseDate(value);
  return d ? d.toLocaleString() : '-';
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function hasActiveAssignment(trip: TripEntity): boolean {
  const assignments = (trip.tripAssignments || []) as unknown as Array<{ status?: string; endTime?: string | null }>;
  return assignments.some((a) => {
    const status = (a.status || '').toUpperCase();
    // Treat missing endTime as still active (older responses may omit it)
    const activeByTime = a.endTime == null;
    return status === 'ASSIGNED' && activeByTime;
  });
}

export default function AdminHome() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<TripEntity[]>([]);
  const [totalTrips, setTotalTrips] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const page = await getAdminTripsPage({ page: 1, limit: 200 });
      setTrips(page.trips || []);
      setTotalTrips(typeof page.total === 'number' ? page.total : null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const now = useMemo(() => new Date(), []);

  const computed = useMemo(() => {
    const list = trips || [];

    const activeStatuses = new Set(['CREATED', 'CONFIRMED', 'DRIVER_ASSIGNED', 'STARTED']);
    const doneStatuses = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);

    const activeNow = list.filter((t) => activeStatuses.has((t.status || '').toUpperCase()));
    const unassigned = list.filter((t) => !doneStatuses.has((t.status || '').toUpperCase()) && !hasActiveAssignment(t));

    const tripsToday = list.filter((t) => {
      const d = parseDate(t.pickupTime || t.tripDate || null);
      return d ? isSameLocalDay(d, now) : false;
    });

    const completedToday = list.filter((t) => {
      if ((t.status || '').toUpperCase() !== 'COMPLETED') return false;
      const d = parseDate(t.completedAt || t.updatedAt || null);
      return d ? isSameLocalDay(d, now) : false;
    });

    const revenueToday = completedToday.reduce((sum, t) => sum + (typeof t.price === 'number' ? t.price : 0), 0);

    const upcoming = list
      .map((t) => {
        const d = parseDate(t.pickupTime || t.tripDate || null);
        return { t, d };
      })
      .filter(({ d }) => {
        if (!d) return false;
        const ms = d.getTime() - now.getTime();
        return ms >= 0 && ms <= 6 * 60 * 60 * 1000; // next 6 hours
      })
      .sort((a, b) => (a.d?.getTime() || 0) - (b.d?.getTime() || 0))
      .map(({ t }) => t);

    return {
      activeNow,
      unassigned,
      tripsToday,
      completedToday,
      revenueToday,
      upcoming,
    };
  }, [now, trips]);

  const unassignedColumns: Column<TripEntity>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'pickupTime', label: 'Pickup Time', render: (t) => fmtDateTime(t.pickupTime || t.tripDate || null) },
    { key: 'originCity', label: 'Origin', render: (t) => t.originCity || '-' },
    { key: 'destinationCity', label: 'Destination', render: (t) => t.destinationCity || '-' },
    { key: 'status', label: 'Status', render: (t) => t.status || '-' },
    {
      key: 'action',
      label: 'Action',
      render: (t) => (
        <Button variant="secondary" className="px-3 py-1" onClick={() => nav(`/admin/trips/${t.id}`)}>
          Open
        </Button>
      ),
    },
  ];

  const upcomingColumns: Column<TripEntity>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'pickupTime', label: 'Pickup Time', render: (t) => fmtDateTime(t.pickupTime || t.tripDate || null) },
    { key: 'pickup', label: 'Pickup', render: (t) => t.pickupLocation || t.originCity || '-' },
    { key: 'drop', label: 'Drop', render: (t) => t.dropLocation || t.destinationCity || '-' },
    { key: 'status', label: 'Status', render: (t) => t.status || '-' },
    {
      key: 'details',
      label: 'Details',
      render: (t) => (
        <Button variant="secondary" className="px-3 py-1" onClick={() => nav(`/admin/trips/${t.id}`)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="text-sm text-black/60">
            Overview of operations {totalTrips != null ? `(Total trips: ${totalTrips})` : ''}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)}>+ Create Trip</Button>
          <Button variant="secondary" onClick={() => nav('/admin/trips')}>
            Trips
          </Button>
          <Button variant="secondary" onClick={() => nav('/admin/drivers')}>
            Drivers
          </Button>
          <Button variant="secondary" onClick={() => nav('/admin/vehicles')}>
            Vehicles
          </Button>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Trip">
        <AddTrip
          onClose={() => setCreateOpen(false)}
          onCreated={() => void refresh()}
        />
      </Modal>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Trips Today</div>
          <div className="text-2xl font-semibold">{computed.tripsToday.length}</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Active Trips Now</div>
          <div className="text-2xl font-semibold">{computed.activeNow.length}</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Unassigned Trips</div>
          <div className="text-2xl font-semibold">{computed.unassigned.length}</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Revenue Today</div>
          <div className="text-2xl font-semibold">{Math.round(computed.revenueToday)}</div>
        </div>
      </div>

      {loading ? <div className="text-sm text-black/60">Loading dashboard…</div> : null}

      {/* Queues */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Unassigned Trips</div>
              <div className="text-xs text-black/60">Trips that can be dispatched</div>
            </div>
            <Button variant="secondary" className="px-3 py-1" onClick={() => nav('/admin/trips')}>
              View all
            </Button>
          </div>
          <Table columns={unassignedColumns} data={computed.unassigned.slice(0, 8)} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Upcoming Pickups (next 6 hours)</div>
              <div className="text-xs text-black/60">Keep an eye on on-time starts</div>
            </div>
            <Button variant="secondary" className="px-3 py-1" onClick={() => nav('/admin/trips')}>
              View all
            </Button>
          </div>
          <Table columns={upcomingColumns} data={computed.upcoming.slice(0, 8)} />
        </div>
      </div>
    </div>
  );
}

