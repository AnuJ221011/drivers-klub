import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';

import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import PhoneInput from '../ui/PhoneInput';

import { createTrip } from '../../api/trip.api';
import { previewPricing, type PricingPreviewResult } from '../../api/pricing.api';
import { geocodeAddress, getMapAutocomplete, type MapAutocompleteItem } from '../../api/maps.api';
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

type PlaceSelection = {
  address: string;
  lat: number;
  lng: number;
};

function PlaceAutocompleteInput({
  label,
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onPlaceSelected: (p: PlaceSelection) => void;
  placeholder?: string;
  helperText?: ReactNode;
}) {
  const [items, setItems] = useState<MapAutocompleteItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastQueryRef = useRef<string>('');
  const blurTimeoutRef = useRef<number | null>(null);

  const runSearch = useCallback(async () => {
    const q = (value || '').trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }

    lastQueryRef.current = q;
    setLoading(true);
    try {
      const res = await getMapAutocomplete(q);
      if (lastQueryRef.current !== q) return;
      setItems(res || []);
      setOpen(true);
    } catch {
      setItems([]);
      setOpen(false);
    } finally {
      if (lastQueryRef.current === q) setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    const q = (value || '').trim();
    const t = window.setTimeout(() => {
      void runSearch();
    }, q.length < 2 ? 0 : 250);
    return () => window.clearTimeout(t);
  }, [runSearch, value]);

  const onPick = useCallback(
    async (item: MapAutocompleteItem) => {
      try {
        setOpen(false);
        setItems([]);
        setLoading(true);
        const geo = await geocodeAddress(item.description);
        onPlaceSelected({
          lat: geo.lat,
          lng: geo.lng,
          address: geo.formattedAddress || item.description,
        });
      } catch (err: unknown) {
        const maybeAny = err as { response?: { data?: unknown } };
        const data = maybeAny.response?.data;
        const msg =
          data && typeof data === 'object' && 'message' in data
            ? String((data as Record<string, unknown>).message)
            : 'Failed to geocode address';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [onPlaceSelected]
  );

  return (
    <div
      className="space-y-1 relative"
      onMouseDown={() => {
        if (blurTimeoutRef.current) {
          window.clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
      }}
    >
      <label className="text-sm font-medium text-black">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        className="
          w-full rounded-md border border-black/20 px-3 py-2 text-sm text-black
          placeholder:text-black/40 focus:outline-none focus:ring-2
          focus:ring-yellow-400 focus:border-yellow-400
        "
      />
      {helperText ? (
        <div className="text-xs text-black/60">{helperText}</div>
      ) : null}

      {open && (items.length > 0 || loading) ? (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-black/10 bg-white shadow-lg overflow-hidden">
          {loading ? (
            <div className="px-3 py-2 text-xs text-black/60">Searching…</div>
          ) : null}
          {items.slice(0, 8).map((it) => (
            <button
              key={it.place_id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void onPick(it)}
              title={it.description}
            >
              {it.description}
            </button>
          ))}
          {!loading && items.length === 0 ? (
            <div className="px-3 py-2 text-xs text-black/60">No results</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function AddTrip({ onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimate, setEstimate] = useState<PricingPreviewResult | null>(null);

  const [tripType, setTripType] = useState<'AIRPORT' | 'RENTAL' | 'INTER_CITY'>('AIRPORT');
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
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [bookingType, setBookingType] = useState<'PREBOOK' | 'INSTANT'>('PREBOOK');

  async function handleGetEstimate() {
    const pickupValue = pickupLocation.trim();
    const dropValue = dropLocation.trim();
    const tripDate = new Date(tripDateLocal);

    if (!pickupValue || !dropValue) {
      toast.error('Pickup and drop locations are required');
      return;
    }

    if (Number.isNaN(tripDate.getTime())) {
      toast.error('Select a valid trip date and time');
      return;
    }

    setLoadingEstimate(true);
    try {
      let resolvedPickup = pickupCoords;
      let resolvedDrop = dropCoords;
      let resolvedPickupAddress = pickupValue;
      let resolvedDropAddress = dropValue;

      if (!resolvedPickup) {
        const geo = await geocodeAddress(pickupValue);
        resolvedPickup = { lat: geo.lat, lng: geo.lng };
        resolvedPickupAddress = geo.formattedAddress || pickupValue;
        setPickupCoords(resolvedPickup);
        setPickupLocation(resolvedPickupAddress);
      }

      if (!resolvedDrop) {
        const geo = await geocodeAddress(dropValue);
        resolvedDrop = { lat: geo.lat, lng: geo.lng };
        resolvedDropAddress = geo.formattedAddress || dropValue;
        setDropCoords(resolvedDrop);
        setDropLocation(resolvedDropAddress);
      }

      const data = await previewPricing({
        tripType,
        tripDate: tripDate.toISOString(),
        bookingDate: new Date().toISOString(),
        pickup: resolvedPickupAddress,
        drop: resolvedDropAddress,
        pickupLat: resolvedPickup.lat,
        pickupLng: resolvedPickup.lng,
        dropLat: resolvedDrop.lat,
        dropLng: resolvedDrop.lng,
        vehicleType: vehicleSku.includes('EV') ? 'EV' : 'NON_EV',
      });
      setEstimate(data);
      if (Number.isFinite(data.distanceKm)) {
        setDistanceKm(String(Math.round(data.distanceKm)));
      }
    } catch {
      toast.error('Failed to fetch estimate');
    } finally {
      setLoadingEstimate(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const tripDate = new Date(tripDateLocal);

    const pickupValue = pickupLocation.trim();
    const dropValue = dropLocation.trim();
    const phoneDigits = passengerPhone.replace(/\D/g, '');
    const distanceValue = distanceKm.trim();
    const distance = distanceValue ? Number(distanceValue) : undefined;

    if (!pickupValue || !dropValue) {
      toast.error('Pickup and drop locations are required');
      return;
    }

    if (!passengerName.trim() || !phoneDigits) {
      toast.error('Passenger name and phone are required');
      return;
    }

    if (phoneDigits.length !== 10) {
      toast.error('Passenger phone must be 10 digits');
      return;
    }

    if (distance !== undefined && (!Number.isFinite(distance) || distance <= 0)) {
      toast.error('Enter valid distance');
      return;
    }

    if (Number.isNaN(tripDate.getTime())) {
      toast.error('Invalid trip details');
      return;
    }

    setSaving(true);
    try {
      let resolvedPickup = pickupCoords;
      let resolvedDrop = dropCoords;
      let resolvedPickupAddress = pickupValue;
      let resolvedDropAddress = dropValue;

      if (!resolvedPickup) {
        const geo = await geocodeAddress(pickupValue);
        resolvedPickup = { lat: geo.lat, lng: geo.lng };
        resolvedPickupAddress = geo.formattedAddress || pickupValue;
        setPickupCoords(resolvedPickup);
        setPickupLocation(resolvedPickupAddress);
      }

      if (!resolvedDrop) {
        const geo = await geocodeAddress(dropValue);
        resolvedDrop = { lat: geo.lat, lng: geo.lng };
        resolvedDropAddress = geo.formattedAddress || dropValue;
        setDropCoords(resolvedDrop);
        setDropLocation(resolvedDropAddress);
      }

      const created = await createTrip({
        pickupLocation: {
          address: resolvedPickupAddress,
          latitude: resolvedPickup.lat,
          longitude: resolvedPickup.lng,
        },
        dropLocation: {
          address: resolvedDropAddress,
          latitude: resolvedDrop.lat,
          longitude: resolvedDrop.lng,
        },
        pickupTime: tripDate.toISOString(),
        passengerName: passengerName.trim(),
        passengerPhone: phoneDigits,
        bookingType,
        distanceKm: distance,
        bookingDate: new Date().toISOString(),
        tripDate: tripDate.toISOString(),
        originCity,
        destinationCity: destinationCity || undefined,
        tripType,
        vehicleSku,
        vehicleType: vehicleSku.includes('EV') ? 'EV' : 'NON_EV',
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
        onChange={(e) => setTripType(e.target.value as 'AIRPORT' | 'RENTAL' | 'INTER_CITY')}
        options={[
          { label: 'Airport', value: 'AIRPORT' },
          { label: 'Rental', value: 'RENTAL' },
          { label: 'Inter-city', value: 'INTER_CITY' },
        ]}
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

      <PlaceAutocompleteInput
        label="Pickup Location"
        value={pickupLocation}
        onChange={(value) => {
          setPickupLocation(value);
          setPickupCoords(null);
        }}
        onPlaceSelected={(place) => {
          setPickupLocation(place.address);
          setPickupCoords({ lat: place.lat, lng: place.lng });
        }}
      />
      <PlaceAutocompleteInput
        label="Drop Location"
        value={dropLocation}
        onChange={(value) => {
          setDropLocation(value);
          setDropCoords(null);
        }}
        onPlaceSelected={(place) => {
          setDropLocation(place.address);
          setDropCoords({ lat: place.lat, lng: place.lng });
        }}
      />

      <Select
        label="Booking Type"
        value={bookingType}
        onChange={(e) => setBookingType(e.target.value as 'PREBOOK' | 'INSTANT')}
        options={[
          { label: 'Prebook', value: 'PREBOOK' },
          { label: 'Instant', value: 'INSTANT' },
        ]}
      />

      <Input
        label="Passenger Name"
        value={passengerName}
        onChange={(e) => setPassengerName(e.target.value)}
        placeholder="Passenger name"
      />
      <PhoneInput
        label="Passenger Phone"
        value={passengerPhone}
        onChange={setPassengerPhone}
        placeholder="10-digit phone number"
        requiredDigits={10}
      />

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
        helperText="Auto-calculated from route distance. You can override if needed."
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
            Billable {estimate.billableKm} km · ₹{estimate.ratePerKm}/km
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