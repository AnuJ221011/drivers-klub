import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Modal from '../components/layout/Modal';
import Select from '../components/ui/Select';

import { useFleet } from '../context/FleetContext';
import { getDriversByFleet } from '../api/driver.api';
import { getVehiclesByFleet } from '../api/vehicle.api';
import { getAssignmentsByFleet, getAssignmentsByTrip } from '../api/assignment.api';
import { assignTripDriver, getTripById, reassignTripDriver, unassignTripDriver } from '../api/trip.api';

import type { Driver } from '../models/driver/driver';
import type { Vehicle } from '../models/vehicle/vehicle';
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

function fmtDateTime(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function fmtNumber(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-';
  return String(value);
}

export default function TripDetails() {
  const nav = useNavigate();
  const { id } = useParams();
  const { effectiveFleetId } = useFleet();

  const [tripLoading, setTripLoading] = useState(false);
  const [trip, setTrip] = useState<TripEntity | null>(null);

  const [metaLoading, setMetaLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fleetAssignments, setFleetAssignments] = useState<{ driverId: string; vehicleId: string; status?: string }[]>(
    [],
  );
  const [tripAssignments, setTripAssignments] = useState<
    { id: string; driverId: string; vehicleId: string | null; status?: string; startTime?: string; endTime?: string | null }[]
  >([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);

  const tripId = id || '';

  const resolvedFleetId = trip?.fleetId || effectiveFleetId || null;

  const refreshTrip = useCallback(async () => {
    if (!tripId) return;
    setTripLoading(true);
    try {
      const t = await getTripById(tripId);
      setTrip(t);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load trip'));
    } finally {
      setTripLoading(false);
    }
  }, [tripId]);

  const refreshMeta = useCallback(async () => {
    if (!tripId) return;

    // If we can’t resolve fleet, we can still show trip details but not driver/vehicle selection.
    if (!resolvedFleetId) {
      setDrivers([]);
      setVehicles([]);
      setFleetAssignments([]);
      try {
        const ta = await getAssignmentsByTrip(tripId);
        setTripAssignments(ta || []);
      } catch {
        setTripAssignments([]);
      }
      return;
    }

    setMetaLoading(true);
    try {
      const [d, v, fa, ta] = await Promise.all([
        getDriversByFleet(resolvedFleetId),
        getVehiclesByFleet(resolvedFleetId),
        getAssignmentsByFleet(resolvedFleetId),
        getAssignmentsByTrip(tripId),
      ]);
      setDrivers(d || []);
      setVehicles(v || []);
      setFleetAssignments((fa || []).map((a) => ({ driverId: a.driverId, vehicleId: a.vehicleId, status: a.status })));
      setTripAssignments(ta || []);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load driver/vehicle data'));
    } finally {
      setMetaLoading(false);
    }
  }, [resolvedFleetId, tripId]);

  useEffect(() => {
    void refreshTrip();
  }, [refreshTrip]);

  useEffect(() => {
    if (!tripId) return;
    void refreshMeta();
  }, [tripId, resolvedFleetId, refreshMeta]);

  const activeTripAssignment = useMemo(() => {
    const list = tripAssignments || [];
    const active = list.find((a) => (a.status || '').toUpperCase() === 'ACTIVE' && !a.endTime);
    return active || list[list.length - 1] || null;
  }, [tripAssignments]);

  const assignedDriver = useMemo(() => {
    if (!activeTripAssignment?.driverId) return null;
    return drivers.find((d) => d.id === activeTripAssignment.driverId) || null;
  }, [activeTripAssignment?.driverId, drivers]);

  const assignedVehicle = useMemo(() => {
    if (!activeTripAssignment?.vehicleId) return null;
    return vehicles.find((v) => v.id === activeTripAssignment.vehicleId) || null;
  }, [activeTripAssignment?.vehicleId, vehicles]);

  const displayPickup = trip?.pickupLocation || trip?.pickup || trip?.originCity || '-';
  const displayDrop = trip?.dropLocation || trip?.drop || trip?.destinationCity || '-';
  const displayProvider = trip?.providerMapping?.providerType || trip?.provider || '-';
  const displayFare = trip?.price ?? trip?.fare ?? null;

  const driverOptions = useMemo(() => {
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
    const activeVehicleByDriverId = new Map<string, Vehicle>();
    for (const a of fleetAssignments) {
      if ((a.status || '').toUpperCase() !== 'ACTIVE') continue;
      const veh = vehicleById.get(a.vehicleId);
      if (veh) activeVehicleByDriverId.set(a.driverId, veh);
    }

    const sorted = [...drivers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return [
      { label: 'Select a driver', value: '' },
      ...sorted.map((d) => {
        const veh = activeVehicleByDriverId.get(d.id);
        const vehicleLabel = veh ? ` • ${veh.number} (${veh.brand} ${veh.model})` : '';
        const availability = d.isAvailable ? 'Available' : 'Unavailable';
        const active = d.isActive ? 'Active' : 'Inactive';
        return { label: `${d.name} (${d.phone}) — ${active}, ${availability}${vehicleLabel}`, value: d.id };
      }),
    ];
  }, [drivers, fleetAssignments, vehicles]);

  const hasAssignedDriver = Boolean(activeTripAssignment?.driverId);

  const onOpenAssign = useCallback(() => {
    setSelectedDriverId('');
    setAssignOpen(true);
  }, []);

  const onSubmitAssign = useCallback(async () => {
    if (!tripId) return;
    if (!selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }

    setAssignLoading(true);
    try {
      if (hasAssignedDriver) {
        await reassignTripDriver(tripId, selectedDriverId);
        toast.success('Driver reassigned');
      } else {
        await assignTripDriver(tripId, selectedDriverId);
        toast.success('Driver assigned');
      }
      setAssignOpen(false);
      await refreshTrip();
      await refreshMeta();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, hasAssignedDriver ? 'Failed to reassign driver' : 'Failed to assign driver'));
    } finally {
      setAssignLoading(false);
    }
  }, [tripId, selectedDriverId, hasAssignedDriver, refreshTrip, refreshMeta]);

  const onUnassign = useCallback(async () => {
    if (!tripId) return;
    setAssignLoading(true);
    try {
      await unassignTripDriver(tripId);
      toast.success('Driver unassigned');
      await refreshTrip();
      await refreshMeta();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to unassign driver'));
    } finally {
      setAssignLoading(false);
    }
  }, [tripId, refreshTrip, refreshMeta]);

  if (!tripId) {
    return <div className="text-sm text-black/60">Invalid trip id.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Trip Details</h1>
          <div className="text-sm text-black/60">Trip ID: {tripId}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => nav('/admin/trips')}>
            Back
          </Button>
          {hasAssignedDriver ? (
            <Button variant="secondary" onClick={() => void onUnassign()} disabled={assignLoading}>
              Unassign
            </Button>
          ) : null}
          <Button onClick={onOpenAssign} disabled={metaLoading || !resolvedFleetId} title={!resolvedFleetId ? 'Fleet not resolved for this trip' : ''}>
            {hasAssignedDriver ? 'Reassign Driver' : 'Assign Driver'}
          </Button>
        </div>
      </div>

      {tripLoading ? (
        <div className="text-sm text-black/60">Loading trip…</div>
      ) : !trip ? (
        <div className="text-sm text-black/60">Trip not found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-black/10 bg-white p-4 space-y-2">
            <div className="text-sm font-semibold">Route</div>
            <div className="text-sm">
              <span className="text-black/60">Pickup:</span> {displayPickup}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Drop:</span> {displayDrop}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Origin City:</span> {trip.originCity || '-'}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Destination City:</span> {trip.destinationCity || '-'}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Pickup Time:</span> {fmtDateTime(trip.pickupTime)}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Distance (km):</span> {fmtNumber(trip.distanceKm)}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Billable (km):</span> {fmtNumber(trip.billableKm)}
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-4 space-y-2">
            <div className="text-sm font-semibold">Trip</div>
            <div className="text-sm">
              <span className="text-black/60">Status:</span> {trip.status || '-'}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Trip Type:</span> {trip.tripType || '-'}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Fare:</span> {displayFare == null ? '-' : String(displayFare)}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Rate/Km:</span> {fmtNumber(trip.ratePerKm)}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Provider:</span> {displayProvider}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Provider Booking ID:</span> {trip.providerBookingId || trip.providerMapping?.providerBookingId || '-'}
            </div>
            <div className="text-sm">
              <span className="text-black/60">External Booking ID:</span> {trip.providerMapping?.externalBookingId || '-'}
            </div>
            <div className="text-sm">
              <span className="text-black/60">Vehicle SKU:</span> {trip.vehicleSku || '-'}
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-4 space-y-2 md:col-span-2">
            <div className="text-sm font-semibold">Driver & Vehicle</div>
            {!activeTripAssignment ? (
              <div className="text-sm text-black/60">No driver assigned yet.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="text-sm">
                  <div className="text-black/60">Assignment Status</div>
                  <div>{activeTripAssignment.status || '-'}</div>
                </div>
                <div className="text-sm">
                  <div className="text-black/60">Driver</div>
                  <div>{assignedDriver ? `${assignedDriver.name} (${assignedDriver.phone})` : activeTripAssignment.driverId}</div>
                </div>
                <div className="text-sm">
                  <div className="text-black/60">Vehicle</div>
                  <div>
                    {assignedVehicle
                      ? `${assignedVehicle.number} (${assignedVehicle.brand} ${assignedVehicle.model})`
                      : activeTripAssignment.vehicleId}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={assignOpen}
        onClose={() => (assignLoading ? null : setAssignOpen(false))}
        title={hasAssignedDriver ? 'Reassign Driver' : 'Assign Driver'}
      >
        {!resolvedFleetId ? (
          <div className="text-sm text-black/60">Fleet not resolved for this trip, so driver list can’t be loaded.</div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} options={driverOptions} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={assignLoading}>
                Cancel
              </Button>
              <Button onClick={() => void onSubmitAssign()} loading={assignLoading} disabled={!selectedDriverId}>
                {hasAssignedDriver ? 'Reassign' : 'Assign'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

