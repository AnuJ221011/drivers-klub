import { useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

import { createTrip } from '../../api/trip.api';
import type { TripEntity } from '../../models/trip/trip';

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

function toDateTimeLocalValue(d: Date): string {
  // YYYY-MM-DDTHH:mm (local time)
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

type Props = {
  onClose: () => void;
  onCreated?: (trip: TripEntity) => void;
};

export default function AddTrip({ onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);

  // Backend currently enforces only these values via TripRules
  const [tripType, setTripType] = useState<'AIRPORT'>('AIRPORT');
  const [vehicleSku, setVehicleSku] = useState<'TATA_TIGOR_EV'>('TATA_TIGOR_EV');
  const [originCity, setOriginCity] = useState<'DELHI' | 'NOIDA' | 'GURGAON' | 'FARIDABAD' | 'GHAZIABAD'>('DELHI');

  const defaultTripDateLocal = useMemo(() => {
    // Next-day 04:00 (to satisfy prebook constraints)
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(4, 0, 0, 0);
    return toDateTimeLocalValue(d);
  }, []);

  const [tripDateLocal, setTripDateLocal] = useState<string>(defaultTripDateLocal);
  const [distanceKm, setDistanceKm] = useState<string>('10');
  const [destinationCity, setDestinationCity] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [dropLocation, setDropLocation] = useState<string>('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const distance = Number(distanceKm);
    if (!Number.isFinite(distance) || distance <= 0) return toast.error('Please enter a valid distance');
    if (!tripDateLocal) return toast.error('Please select trip date/time');
    const tripDate = new Date(tripDateLocal);
    if (Number.isNaN(tripDate.getTime())) return toast.error('Invalid trip date/time');

    setSaving(true);
    try {
      const created = await createTrip({
        distanceKm: distance,
        bookingDate: new Date().toISOString(),
        tripDate: tripDate.toISOString(),
        originCity,
        destinationCity: destinationCity.trim() || undefined,
        pickupLocation: pickupLocation.trim() || undefined,
        dropLocation: dropLocation.trim() || undefined,
        tripType,
        vehicleSku,
      });
      toast.success('Trip created');
      onCreated?.(created);
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create trip'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="
        space-y-4
        max-h-[70vh]
        overflow-y-auto
        pr-1
      "
    >
      <Select
        label="Trip Type"
        value={tripType}
        onChange={(e) => setTripType(e.target.value as typeof tripType)}
        options={[{ label: 'Airport', value: 'AIRPORT' }]}
        disabled={saving}
      />

      <Select
        label="Origin City"
        value={originCity}
        onChange={(e) => setOriginCity(e.target.value as typeof originCity)}
        options={[
          { label: 'Delhi', value: 'DELHI' },
          { label: 'Noida', value: 'NOIDA' },
          { label: 'Gurgaon', value: 'GURGAON' },
          { label: 'Faridabad', value: 'FARIDABAD' },
          { label: 'Ghaziabad', value: 'GHAZIABAD' },
        ]}
        disabled={saving}
      />

      <Input
        label="Destination City (optional)"
        placeholder="e.g. Delhi"
        value={destinationCity}
        onChange={(e) => setDestinationCity(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Pickup Location (optional)"
        placeholder="e.g. Terminal 3"
        value={pickupLocation}
        onChange={(e) => setPickupLocation(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Drop Location (optional)"
        placeholder="e.g. Sector 18"
        value={dropLocation}
        onChange={(e) => setDropLocation(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Trip Date & Time"
        type="datetime-local"
        value={tripDateLocal}
        onChange={(e) => setTripDateLocal(e.target.value)}
        disabled={saving}
      />

      <Input
        label="Distance (km)"
        type="number"
        min={1}
        step={1}
        value={distanceKm}
        onChange={(e) => setDistanceKm(e.target.value)}
        disabled={saving}
      />

      <Select
        label="Vehicle SKU"
        value={vehicleSku}
        onChange={(e) => setVehicleSku(e.target.value as typeof vehicleSku)}
        options={[{ label: 'TATA_TIGOR_EV', value: 'TATA_TIGOR_EV' }]}
        disabled={saving}
      />

      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          Create Trip
        </Button>
      </div>
    </form>
  );
}

