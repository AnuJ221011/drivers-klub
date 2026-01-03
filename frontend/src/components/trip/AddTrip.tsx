import { useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

import { createTrip } from '../../api/trip.api';
import { previewPricing } from '../../api/pricing.api';
import type { TripEntity } from '../../models/trip/trip';

function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

type Props = {
  onClose: () => void;
  onCreated?: (trip: TripEntity) => void;
};

export default function AddTrip({ onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimate, setEstimate] = useState<null | {
    baseFare: number;
    distanceCharge: number;
    totalFare: number;
    breakdown: {
      minBillableKm: number;
      ratePerKm: number;
    };
  }>(null);

  const [tripType, setTripType] = useState<'AIRPORT'>('AIRPORT');
  const [originCity, setOriginCity] = useState<'DELHI' | 'NOIDA' | 'GURGAON' | 'FARIDABAD' | 'GHAZIABAD'>('DELHI');
  const [vehicleSku, setVehicleSku] = useState<'TATA_TIGOR_EV'>('TATA_TIGOR_EV');

  const defaultTripDateLocal = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(4, 0, 0, 0);
    return toDateTimeLocalValue(d);
  }, []);

  const [tripDateLocal, setTripDateLocal] = useState(defaultTripDateLocal);
  const [distanceKm, setDistanceKm] = useState('10');
  const [destinationCity, setDestinationCity] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');

  async function handleGetEstimate() {
    const distance = Number(distanceKm);
    if (!Number.isFinite(distance) || distance <= 0) {
      toast.error('Enter valid distance');
      return;
    }

    setLoadingEstimate(true);
    try {
      const data = await previewPricing({
        distanceKm: distance,
        tripType,
      });
      setEstimate(data);
    } catch {
      toast.error('Failed to fetch estimate');
    } finally {
      setLoadingEstimate(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const distance = Number(distanceKm);
    const tripDate = new Date(tripDateLocal);

    if (!distance || Number.isNaN(tripDate.getTime())) {
      toast.error('Invalid trip details');
      return;
    }

    setSaving(true);
    try {
      const created = await createTrip({
        distanceKm: distance,
        bookingDate: new Date().toISOString(),
        tripDate: tripDate.toISOString(),
        originCity,
        destinationCity: destinationCity || undefined,
        pickupLocation: pickupLocation || undefined,
        dropLocation: dropLocation || undefined,
        tripType,
        vehicleSku,
      });

      toast.success('Trip created');
      onCreated?.(created);
      onClose();
    } catch {
      toast.error('Failed to create trip');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <Select
        label="Trip Type"
        value={tripType}
        onChange={(e) => setTripType(e.target.value as 'AIRPORT')}
        options={[{ label: 'Airport', value: 'AIRPORT' }]}
      />

      <Select
        label="Origin City"
        value={originCity}
        onChange={(e) => setOriginCity(e.target.value as any)}
        options={[
          { label: 'Delhi', value: 'DELHI' },
          { label: 'Noida', value: 'NOIDA' },
          { label: 'Gurgaon', value: 'GURGAON' },
          { label: 'Faridabad', value: 'FARIDABAD' },
          { label: 'Ghaziabad', value: 'GHAZIABAD' },
        ]}
      />

      <Input label="Pickup Location" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} />
      <Input label="Drop Location" value={dropLocation} onChange={(e) => setDropLocation(e.target.value)} />

      <Input
        label="Trip Date & Time"
        type="datetime-local"
        value={tripDateLocal}
        onChange={(e) => setTripDateLocal(e.target.value)}
      />

      <Input
        label="Distance (km)"
        type="number"
        min={1}
        value={distanceKm}
        onChange={(e) => setDistanceKm(e.target.value)}
      />

      {/* Get Estimate */}
      {!estimate ? (
        <Button
          type="button"
          variant="secondary"
          onClick={handleGetEstimate}
          loading={loadingEstimate}
          className="w-full"
        >
          Get Estimate
        </Button>
      ) : (
        <div className="rounded-lg border bg-gray-50 p-4 space-y-2 text-sm">
          <h4 className="font-medium">Fare Estimate</h4>
          <div className="flex justify-between">
            <span>Base Fare</span>
            <span>₹{estimate.baseFare}</span>
          </div>
          <div className="flex justify-between">
            <span>Distance Charge</span>
            <span>₹{estimate.distanceCharge}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Fare</span>
            <span>₹{estimate.totalFare}</span>
          </div>

          <div className="text-xs text-black/60">
            Min {estimate.breakdown.minBillableKm} km · ₹{estimate.breakdown.ratePerKm}/km
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setEstimate(null)}
            className="mt-2"
          >
            Back
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Create Trip
        </Button>
      </div>
    </form>
  );
}