import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Filter } from 'lucide-react';

import Table, { type Column } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/layout/Modal';
import Select from '../components/ui/Select';
import { useFleet } from '../context/FleetContext';
import { assignDriverToTrip, getTripsByFleet, updateTripStatus } from '../api/trip.api';
import type { TripEntity } from '../models/trip/trip';
import { getDriversByFleet } from '../api/driver.api';
import type { Driver } from '../models/driver/driver';

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
  const { effectiveFleetId } = useFleet();
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<TripEntity[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchPickup, setSearchPickup] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState<TripEntity | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [nextStatus, setNextStatus] = useState<TripEntity['status']>('CREATED');
  const [saving, setSaving] = useState(false);

  const refreshTrips = useCallback(async () => {
    if (!effectiveFleetId) {
      toast.error('No fleet selected/available');
      return;
    }
    setLoading(true);
    try {
      const data = await getTripsByFleet(effectiveFleetId);
      setTrips(data || []);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load trips'));
    } finally {
      setLoading(false);
    }
  }, [effectiveFleetId]);

  useEffect(() => {
    void refreshTrips();
  }, [refreshTrips]);

  const filteredTrips = useMemo(() => {
    const pickupNeedle = (searchPickup || '').trim().toLowerCase();
    const statusNeedle = (searchStatus || '').trim().toUpperCase();

    return trips.filter((t) => {
      const pickupOk =
        !pickupNeedle ||
        (t.originCity || '').toLowerCase().includes(pickupNeedle) ||
        (t.destinationCity || '').toLowerCase().includes(pickupNeedle);
      const statusOk = !statusNeedle || (t.status || '').toUpperCase().includes(statusNeedle);
      return pickupOk && statusOk;
    });
  }, [trips, searchPickup, searchStatus]);

  const availableDrivers = useMemo(
    () => (drivers || []).filter((d) => d.isActive && d.isAvailable),
    [drivers],
  );

  const statusOptions: { label: string; value: TripEntity['status'] }[] = useMemo(
    () => [
      { label: 'CREATED', value: 'CREATED' },
      { label: 'CONFIRMED', value: 'CONFIRMED' },
      { label: 'DRIVER_ASSIGNED', value: 'DRIVER_ASSIGNED' },
      { label: 'STARTED', value: 'STARTED' },
      { label: 'COMPLETED', value: 'COMPLETED' },
      { label: 'CANCELLED', value: 'CANCELLED' },
      { label: 'FAILED', value: 'FAILED' },
    ],
    [],
  );

  const driverOptions = useMemo(
    () => availableDrivers.map((d) => ({ label: `${d.name} (${d.phone})`, value: d.id })),
    [availableDrivers],
  );

  const openAssign = useCallback(
    async (trip: TripEntity) => {
      if (!effectiveFleetId) return toast.error('No fleet selected/available');
      setActiveTrip(trip);
      setAssignOpen(true);
      setSelectedDriverId('');

      setDriversLoading(true);
      try {
        const list = await getDriversByFleet(effectiveFleetId);
        setDrivers(list);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, 'Failed to load drivers'));
      } finally {
        setDriversLoading(false);
      }
    },
    [effectiveFleetId],
  );

  const openStatus = useCallback((trip: TripEntity) => {
    setActiveTrip(trip);
    setNextStatus(trip.status);
    setStatusOpen(true);
  }, []);

  async function onAssign() {
    if (!activeTrip) return;
    if (!selectedDriverId) return toast.error('Please select a driver');
    setSaving(true);
    try {
      await assignDriverToTrip(activeTrip.id, selectedDriverId);
      toast.success('Driver assigned');
      setAssignOpen(false);
      setActiveTrip(null);
      await refreshTrips();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to assign driver'));
    } finally {
      setSaving(false);
    }
  }

  async function onUpdateStatus() {
    if (!activeTrip) return;
    setSaving(true);
    try {
      await updateTripStatus(activeTrip.id, nextStatus);
      toast.success('Trip status updated');
      setStatusOpen(false);
      setActiveTrip(null);
      await refreshTrips();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update trip status'));
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<TripEntity>[] = [
    {
      key: 'index',
      label: 'S.No',
      render: (_, i) => i + 1,
    },
    {
      key: 'originCity',
      label: 'Pickup',
    },
    {
      key: 'destinationCity',
      label: 'Drop',
    },
    { key: 'tripType', label: 'Type' },
    {
      key: 'pickupTime',
      label: 'Pickup Time',
      render: (t) => new Date(t.pickupTime).toLocaleString(),
    },
    { key: 'status', label: 'Status' },
    {
      key: 'price',
      label: 'Fare',
      render: (t) => String(t.price ?? '-'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (t) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void openAssign(t)}>
            Assign Driver
          </Button>
          <Button variant="secondary" onClick={() => openStatus(t)}>
            Update Status
          </Button>
        </div>
      ),
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
          placeholder="Search by pickup/drop"
          value={searchPickup}
          onChange={(e) => setSearchPickup(e.target.value)}
        />
        <Input
          placeholder="Search by status"
          value={searchStatus}
          onChange={(e) => setSearchStatus(e.target.value)}
        />
      </div>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Driver">
        <div className="space-y-4">
          <div className="text-sm text-black/60">
            Trip: <span className="font-medium">{activeTrip?.originCity}</span> →{' '}
            <span className="font-medium">{activeTrip?.destinationCity}</span>
          </div>

          <Select
            label="Available Drivers"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            options={driverOptions}
            disabled={driversLoading || driverOptions.length === 0}
          />

          {driverOptions.length === 0 && !driversLoading ? (
            <div className="text-sm text-black/60">No available drivers in this fleet.</div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onAssign()} loading={saving} disabled={saving || !selectedDriverId}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="Update Trip Status">
        <div className="space-y-4">
          <div className="text-sm text-black/60">
            Trip: <span className="font-medium">{activeTrip?.originCity}</span> →{' '}
            <span className="font-medium">{activeTrip?.destinationCity}</span>
          </div>

          <Select
            label="Status"
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as TripEntity['status'])}
            options={statusOptions}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onUpdateStatus()} loading={saving} disabled={saving}>
              Update
            </Button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <div className="text-sm text-black/60">Loading trips…</div>
      ) : (
        <Table columns={columns} data={filteredTrips} />
      )}
    </div>
  );
}
