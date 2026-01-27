import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import logo from '../assets/images/logo.png';
import {
  CalendarDays,
  Clock,
  MapPin,
  MapPinOff,
  Phone,
  User,
} from 'lucide-react';
import {
  createPublicTrip,
  type PublicTripType,
} from '../api/publicTrips.api';
import { previewPricing, type PricingPreviewResult } from '../api/pricing.api';
import {
  geocodeAddress,
  getMapAutocomplete,
  type MapAutocompleteItem,
} from '../api/maps.api';
import PhoneInput from '../components/ui/PhoneInput';

/* ---------------- Utilities ---------------- */

function toDateValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizePhone(value: string): string {
  return (value || '').replace(/\D/g, '');
}

function formatCurrency(value: number, currency = 'INR'): string {
  return `${currency} ${value}`;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    if (err instanceof Error && err.message) return err.message;
    const anyErr = err as { response?: { data?: { message?: string } } };
    return anyErr.response?.data?.message || fallback;
  }
  return fallback;
}

function toPickupDateTime(pickupDate: string, pickupTime: string): Date | null {
  const datePart = (pickupDate || '').trim();
  const timePart = (pickupTime || '').trim();
  if (!datePart || !timePart) return null;
  const dt = new Date(`${datePart}T${timePart}`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

/* ---------------- Constants ---------------- */

const CITY_SUGGESTIONS = [
  'DELHI',
  'NOIDA',
  'GURGAON',
  'FARIDABAD',
  'GHAZIABAD',
];

const TRIP_TYPE_OPTIONS = [
  { label: 'Airport', value: 'AIRPORT' },
  { label: 'Rental', value: 'RENTAL' },
  { label: 'Inter-city', value: 'INTER_CITY' },
] as const;

/* ---------------- Segmented Fields ---------------- */

type SegmentInputProps = {
  icon: ReactNode;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  list?: string;
};

function SegmentInput({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  min,
  inputMode,
  list,
}: SegmentInputProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1 px-4 py-4">
      <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-black">
        <span className="text-yellow-500">{icon}</span>
        {label}
      </span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        list={list}
        placeholder={placeholder}
        className="w-full bg-transparent text-base font-semibold text-black placeholder:text-black/30 focus:outline-none"
      />
    </label>
  );
}

type SegmentSlotProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

function SegmentSlot({ icon, label, children }: SegmentSlotProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-4">
      <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-black">
        <span className="text-yellow-500">{icon}</span>
        {label}
      </span>
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}

type PlaceSelection = {
  address: string;
  lat: number;
  lng: number;
};

type PlaceAutocompleteSegmentProps = {
  icon: ReactNode;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: PlaceSelection) => void;
  list?: string;
};

function PlaceAutocompleteSegmentInput({
  icon,
  label,
  placeholder,
  value,
  onChange,
  onPlaceSelected,
  list,
}: PlaceAutocompleteSegmentProps) {
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
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to fetch location'));
      } finally {
        setLoading(false);
      }
    },
    [onPlaceSelected]
  );

  return (
    <div
      className="relative"
      onMouseDown={() => {
        if (blurTimeoutRef.current) {
          window.clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
      }}
    >
      <label className="flex min-w-0 flex-col gap-1 px-4 py-4">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-black">
          <span className="text-yellow-500">{icon}</span>
          {label}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (items.length > 0) setOpen(true);
          }}
          onBlur={() => {
            blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 150);
          }}
          list={list}
          placeholder={placeholder}
          className="w-full bg-transparent text-base font-semibold text-black placeholder:text-black/30 focus:outline-none"
        />
      </label>

      {open && (items.length > 0 || loading) ? (
        <div className="absolute z-20 -mt-2 w-full rounded-md border border-black/10 bg-white shadow-lg overflow-hidden">
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

/* ---------------- Main Component ---------------- */

export default function CreateRide() {
  const defaultPickupDateTime = useMemo(() => {
    const d = addDays(new Date(), 1);
    d.setHours(4, 0, 0, 0);
    return d;
  }, []);

  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [tripType, setTripType] = useState<PublicTripType>('AIRPORT');
  const [pickupDate, setPickupDate] = useState(
    toDateValue(defaultPickupDateTime)
  );
  const [pickupTime, setPickupTime] = useState(
    toTimeValue(defaultPickupDateTime)
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [estimate, setEstimate] = useState<{
    totalFare: number;
    currency: string;
    distanceKm: number;
  } | null>(null);

  /* RESET ESTIMATE WHEN TOP FIELDS CHANGE */
  useEffect(() => {
    setEstimate(null);
  }, [pickupLocation, dropLocation, tripType, pickupDate, pickupTime]);

  function getBaseIssues(): string[] {
    const issues: string[] = [];

    if (!pickupLocation) issues.push('Enter pickup location');
    if (!dropLocation) issues.push('Enter drop location');
    if (!toPickupDateTime(pickupDate, pickupTime)) {
      issues.push('Select a valid pickup date and time');
    }

    return issues;
  }

  async function resolveLocations() {
    const pickupValue = pickupLocation.trim();
    const dropValue = dropLocation.trim();
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

    return {
      pickupAddress: resolvedPickupAddress,
      dropAddress: resolvedDropAddress,
      pickupCoords: resolvedPickup,
      dropCoords: resolvedDrop,
    };
  }

  async function handleGetEstimate() {
    const issues = getBaseIssues();
    if (issues.length) return toast.error(issues[0]);

    setLoadingEstimate(true);
    try {
      const pickupDateTime = toPickupDateTime(pickupDate, pickupTime);
      if (!pickupDateTime) {
        toast.error('Select a valid pickup date and time');
        return;
      }
      const { pickupAddress, dropAddress, pickupCoords, dropCoords } =
        await resolveLocations();
      const vehicleSku = 'TATA_TIGOR_EV';
      const data: PricingPreviewResult = await previewPricing({
        tripType,
        tripDate: pickupDateTime.toISOString(),
        bookingDate: new Date().toISOString(),
        pickup: pickupAddress,
        drop: dropAddress,
        pickupLat: pickupCoords?.lat,
        pickupLng: pickupCoords?.lng,
        dropLat: dropCoords?.lat,
        dropLng: dropCoords?.lng,
        vehicleSku,
        vehicleType: vehicleSku.includes('EV') ? 'EV' : 'NON_EV',
      });
      setEstimate({
        totalFare: data.totalFare,
        currency: 'INR',
        distanceKm: data.distanceKm,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch pricing'));
    } finally {
      setLoadingEstimate(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const phone = normalizePhone(customerPhone);
    const issues = getBaseIssues();

    if (!customerName) issues.push('Enter customer name');
    if (phone.length !== 10) issues.push('Phone must be 10 digits');

    if (issues.length) return toast.error(issues[0]);

    setSavingTrip(true);
    try {
      const pickupDateTime = toPickupDateTime(pickupDate, pickupTime);
      if (!pickupDateTime) {
        toast.error('Select a valid pickup date and time');
        return;
      }
      const { pickupAddress, dropAddress } = await resolveLocations();
      await createPublicTrip({
        pickupLocation: pickupAddress,
        dropLocation: dropAddress,
        tripDate: pickupDate,
        tripTime: pickupTime,
        tripType,
        customerName: customerName.trim(),
        customerPhone: phone,
      });

      toast.success('Trip created successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create trip'));
    } finally {
      setSavingTrip(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-4">
        <span className="rounded-md bg-yellow-400 px-2 py-1">
          <img src={logo} alt="Drivers Klub" height={48} width={48} />
        </span>
        <span className="text-lg font-bold">Driver&apos;s Klub</span>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 pb-6">
        <section className="w-full rounded-3xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 p-6 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center gap-3">
              {TRIP_TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setTripType(o.value)}
                  className={`rounded-md bg-white px-4 py-2 text-xs font-semibold uppercase border-b-2 ${
                    tripType === o.value
                      ? 'border-black'
                      : 'border-transparent'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <datalist id="supported-cities">
              {CITY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {/* ROW 1 */}
            <div className="grid overflow-visible rounded-2xl border bg-white shadow-lg lg:grid-cols-[1.5fr_1.5fr_1fr_0.9fr_1fr]">
              <PlaceAutocompleteSegmentInput
                icon={<MapPin size={14} />}
                label="From"
                placeholder="Pickup location"
                value={pickupLocation}
                onChange={(value) => {
                  setPickupLocation(value);
                  setPickupCoords(null);
                }}
                onPlaceSelected={(place) => {
                  setPickupLocation(place.address);
                  setPickupCoords({ lat: place.lat, lng: place.lng });
                }}
                list="supported-cities"
              />
              <PlaceAutocompleteSegmentInput
                icon={<MapPinOff size={14} />}
                label="To"
                placeholder="Drop location"
                value={dropLocation}
                onChange={(value) => {
                  setDropLocation(value);
                  setDropCoords(null);
                }}
                onPlaceSelected={(place) => {
                  setDropLocation(place.address);
                  setDropCoords({ lat: place.lat, lng: place.lng });
                }}
                list="supported-cities"
              />
              <SegmentInput
                icon={<CalendarDays size={14} />}
                label="Pickup Date"
                type="date"
                value={pickupDate}
                onChange={setPickupDate}
              />
              <SegmentInput icon={<Clock size={14} />} label="Pickup Time" type="time" value={pickupTime} onChange={setPickupTime} />

              <div className="flex flex-col justify-center px-4 py-4">
                <span className="text-sm font-semibold uppercase text-black/80">
                  Estimate
                </span>
                <button
                  type="button"
                  onClick={handleGetEstimate}
                  disabled={loadingEstimate || savingTrip}
                  className="mt-2 rounded-md bg-amber-400 px-4 py-2 text-xs font-semibold"
                >
                  {loadingEstimate
                    ? 'Calculating...'
                    : estimate
                    ? formatCurrency(estimate.totalFare, estimate.currency)
                    : 'Get Estimated Price'}
                </button>
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="grid overflow-hidden rounded-2xl border bg-white shadow-lg lg:grid-cols-[1.1fr_1.3fr]">
                <SegmentInput
                  icon={<User size={14} />}
                  label="Customer Name"
                  placeholder="Your name"
                  value={customerName}
                  onChange={setCustomerName}
                />
                <SegmentSlot icon={<Phone size={14} />} label="Phone Number">
                  <PhoneInput
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    placeholder="9876543210"
                    wrapperClassName="space-y-0"
                    labelClassName="hidden"
                    prefixClassName="px-0 py-0 bg-transparent border-0"
                    inputClassName="border-0 px-0 py-0 text-base font-semibold"
                    helperClassName="hidden"
                  />
                </SegmentSlot>
              </div>

              <button
                type="submit"
                disabled={savingTrip}
                className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-2xl font-bold shadow-sm"
              >
                {savingTrip ? 'Booking...' : 'Book Ride'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}


