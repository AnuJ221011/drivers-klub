

import {
  useEffect,
  useMemo,
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
  type PublicTripCreateResponse,
  type PublicTripPricing,
  type PublicTripType,
} from '../api/publicTrips.api';
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
  if (!Number.isFinite(value)) return '';
  return `${currency} ${value}`;
}

function getDummyEstimate(tripType: PublicTripType): PublicTripPricing {
  const distanceKm = 48.702;
  const billableDistanceKm = 49;
  const ratePerKm = 25;
  const distanceFare = Math.round(billableDistanceKm * ratePerKm);
  const tripTypeMultiplier =
    tripType === 'RENTAL' ? 1.1 : tripType === 'INTER_CITY' ? 1.2 : 1;
  const totalFare = Math.round(distanceFare * tripTypeMultiplier);

  return {
    vehicleSku: 'TATA_TIGOR_EV',
    vehicleType: 'EV',
    tripType,
    distanceKm,
    billableDistanceKm,
    ratePerKm,
    baseFare: distanceFare,
    totalFare,
    breakdown: {
      distanceFare,
      tripTypeMultiplier,
      bookingTimeMultiplier: 1,
      vehicleMultiplier: 1,
    },
    currency: 'INR',
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    if (err instanceof Error && err.message) return err.message;
    const maybeAny = err as { response?: { data?: unknown } };
    const data = maybeAny.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      return String((data as Record<string, unknown>).message);
    }
  }
  return fallback;
}

const CITY_SUGGESTIONS = [
  'Delhi',
  'Noida',
  'Gurgaon',
  'Faridabad',
  'Ghaziabad',
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
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  pattern?: string;
  maxLength?: number;
  autoComplete?: string;
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
  pattern,
  maxLength,
  autoComplete,
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
        pattern={pattern}
        maxLength={maxLength}
        autoComplete={autoComplete}
        list={list}
        placeholder={placeholder}
        className="
          w-full
          bg-transparent
          text-base
          font-semibold
          text-black
          placeholder:text-black/30
          focus:outline-none
        "
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

/* ---------------- Main Component ---------------- */

export default function CreateRide() {
  const defaultPickupDateTime = useMemo(() => {
    const d = addDays(new Date(), 1);
    d.setHours(10, 30, 0, 0);
    return d;
  }, []);

  const minPickupDate = useMemo(
    () => toDateValue(addDays(new Date(), 1)),
    []
  );

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
  const [estimate, setEstimate] = useState<PublicTripPricing | null>(
    null
  );
  const [createdTrip, setCreatedTrip] =
    useState<PublicTripCreateResponse | null>(null);

  useEffect(() => {
    setEstimate(null);
  }, [pickupLocation, dropLocation, tripType, pickupDate, pickupTime]);

  useEffect(() => {
    setCreatedTrip(null);
  }, [
    pickupLocation,
    dropLocation,
    tripType,
    pickupDate,
    pickupTime,
    customerName,
    customerPhone,
  ]);

  function getBaseIssues(): string[] {
    const issues: string[] = [];
    const pickupDateTime = new Date(
      `${pickupDate}T${pickupTime}`
    );
    const minDate = minPickupDate;
    const hour = pickupTime
      ? Number(pickupTime.split(':')[0])
      : Number.NaN;

    if (!pickupLocation.trim()) issues.push('Enter a pickup location');
    if (!dropLocation.trim()) issues.push('Enter a drop location');
    if (!tripType) issues.push('Select a trip type');
    if (
      !pickupDate ||
      !pickupTime ||
      Number.isNaN(pickupDateTime.getTime())
    ) {
      issues.push('Select a valid pickup date and time');
    }
    if (pickupDate && pickupDate < minDate) {
      issues.push('Trips must be booked at least 1 day in advance');
    }
    if (!Number.isNaN(hour) && hour < 4) {
      issues.push(
        'Trips are not available between 12:00 AM and 04:00 AM'
      );
    }

    return issues;
  }

  async function handleGetEstimate() {
    const issues = getBaseIssues();
    if (issues.length > 0) {
      toast.error(issues[0]);
      return;
    }

    setLoadingEstimate(true);
    setTimeout(() => {
      setEstimate(getDummyEstimate(tripType));
      setLoadingEstimate(false);
    }, 300);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const issues = getBaseIssues();
    const phoneDigits = normalizePhone(customerPhone);

    if (!customerName.trim())
      issues.push('Enter customer name');
    if (!phoneDigits)
      issues.push('Enter customer phone');
    if (phoneDigits && phoneDigits.length !== 10)
      issues.push('Customer phone must be 10 digits');

    if (issues.length > 0) {
      toast.error(issues[0]);
      return;
    }

    setSavingTrip(true);
    setCreatedTrip(null);
    try {
      const trip = await createPublicTrip({
        pickupLocation,
        dropLocation,
        tripDate: pickupDate,
        tripTime: pickupTime,
        tripType,
        customerName: customerName.trim(),
        customerPhone: phoneDigits,
      });
      setCreatedTrip(trip);
      toast.success('Trip created successfully');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create trip'));
    } finally {
      setSavingTrip(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl flex-shrink-0 items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-yellow-400 px-2 py-1">
            <img
              src={logo}
              alt="Drivers Klub"
              height={48}
              width={48}
            />
          </span>
          <span className="text-lg font-bold text-black">
            Driver&apos;s Klub
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 pb-6">
        <section className="w-full rounded-3xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 p-6 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {TRIP_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTripType(option.value)}
                  className={`rounded-md bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide transition border-b-2 ${
                    tripType === option.value
                      ? 'border-black text-black'
                      : 'border-transparent text-black/70 hover:border-black/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <datalist id="supported-cities" className="hidden">
              {CITY_SUGGESTIONS.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>

            <div className="grid overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg divide-y divide-black/10 lg:grid-cols-[1.5fr_1.5fr_1fr_0.9fr_1fr] lg:divide-y-0 lg:divide-x">
              <SegmentInput
                icon={<MapPin size={14} />}
                label="From"
                placeholder="Pickup location"
                value={pickupLocation}
                onChange={setPickupLocation}
                list="supported-cities"
              />
              <SegmentInput
                icon={<MapPinOff size={14} />}
                label="To"
                placeholder="Drop location"
                value={dropLocation}
                onChange={setDropLocation}
                list="supported-cities"
              />
              <SegmentInput
                icon={<CalendarDays size={14} />}
                label="Pickup Date"
                type="date"
                min={minPickupDate}
                placeholder="Select date"
                value={pickupDate}
                onChange={setPickupDate}
              />
              <SegmentInput
                icon={<Clock size={14} />}
                label="Pickup Time"
                type="time"
                placeholder="Select time"
                value={pickupTime}
                onChange={setPickupTime}
              />
              <div className="flex flex-col justify-center bg-white-400 px-4 py-4">
                <span className="text-sm font-semibold uppercase tracking-wide text-black/80">
                  Estimate
                </span>
                <button
                  type="button"
                  onClick={handleGetEstimate}
                  disabled={loadingEstimate || savingTrip}
                  className="
                    mt-2
                    flex
                    items-center
                    justify-center
                    rounded-md
                    bg-amber-400
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    text-black
                    transition
                    hover:bg-yellow/20
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {loadingEstimate
                    ? 'Calculating...'
                    : estimate
                    ? 'Update Estimate'
                    : 'Get Estimated Price'}
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="grid overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg divide-y divide-black/10 lg:grid-cols-[1.1fr_1.3fr] lg:divide-y-0 lg:divide-x">
                <SegmentInput
                  icon={<User size={14} />}
                  label="Customer Name"
                  placeholder="Your name"
                  value={customerName}
                  onChange={setCustomerName}
                  autoComplete="name"
                />
                <SegmentSlot icon={<Phone size={14} />} label="Phone Number">
                  <PhoneInput
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    placeholder="9876543210"
                    wrapperClassName="space-y-0"
                    labelClassName="hidden"
                    prefixClassName="px-0 py-0 text-base font-semibold text-black/60 bg-transparent border-0"
                    inputClassName="border-0 rounded-none px-0 py-0 text-base font-semibold text-black placeholder:text-black/30 focus:ring-0 focus:border-0"
                    helperClassName="hidden"
                  />
                </SegmentSlot>
              </div>

              <button
                type="submit"
                disabled={savingTrip}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-white
                  px-4
                  py-3
                  text-2xl
                  font-bold
                  text-black
                  shadow-sm
                  transition
                  hover:bg-white/90
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {savingTrip ? 'Booking...' : 'Book Ride'}
              </button>
            </div>

            {estimate && (
              <div className="flex justify-end">
                <div className="w-full max-w-sm rounded-2xl border border-yellow-200 bg-white p-4 text-xs text-black/70 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-black">
                      Estimated Fare
                    </span>
                    <span className="text-sm font-semibold text-black">
                      {formatCurrency(
                        estimate.totalFare,
                        estimate.currency
                      )}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Distance</span>
                      <span>{estimate.distanceKm.toFixed(2)} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Billable Distance</span>
                      <span>{estimate.billableDistanceKm} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rate Per Km</span>
                      <span>
                        {formatCurrency(
                          estimate.ratePerKm,
                          estimate.currency
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Vehicle</span>
                      <span>{estimate.vehicleSku}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {createdTrip && (
              <div className="flex justify-end">
                <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 text-xs text-black/70 shadow-lg">
                  <div className="text-sm font-semibold text-black">
                    Trip created
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Trip ID</span>
                      <span className="font-medium text-black">
                        {createdTrip.tripId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span>{createdTrip.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Price</span>
                      <span>
                        {formatCurrency(createdTrip.price, 'INR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}



