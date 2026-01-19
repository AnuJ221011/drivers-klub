

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import logo from '../assets/images/logo.png';
import {
  CalendarDays,
  Clock,
  MapPin,
  MapPinOff,
} from 'lucide-react';

/* ---------------- Utilities ---------------- */

function toDateValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ---------------- Booking Field ---------------- */

type BookingFieldProps = {
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  label?: string;
};

function BookingField({
  icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  min,
  label,
}: BookingFieldProps) {
  return (
    <label className="block space-y-1 text-xs font-medium text-black/70">
      {label && <span>{label}</span>}
      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 shadow-sm">
        <span className="text-yellow-500">{icon}</span>
        <input
          type={type}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full
            bg-transparent
            text-sm
            text-black
            placeholder:text-black/40
            focus:outline-none
          "
        />
      </div>
    </label>
  );
}

/* ---------------- Decorative Path ---------------- */

function RidePath({ className = '' }: { className?: string }) {
  const ridePath =
    'M24 210 C 120 160 210 200 290 130 C 340 85 375 60 400 35';

  return (
    <svg
      className={className}
      viewBox="0 0 420 250"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rideGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
      </defs>

      <path
        d={ridePath}
        stroke="#fde68a"
        strokeWidth="3"
        strokeLinecap="round"
        opacity={0.4}
      />

      <path
        d={ridePath}
        stroke="url(#rideGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 12"
      />

      <g>
        <g transform="translate(-12 -8)">
          <rect x="0" y="6" width="24" height="8" rx="4" fill="#111827" />
          <rect x="6" y="2" width="10" height="6" rx="3" fill="#fde68a" />
          <circle cx="6" cy="14" r="2.2" fill="#111827" />
          <circle cx="18" cy="14" r="2.2" fill="#111827" />
        </g>
        <animateMotion
          dur="6s"
          repeatCount="indefinite"
          rotate="auto"
          path={ridePath}
        />
      </g>
    </svg>
  );
}

/* ---------------- Main Component ---------------- */

export default function CreateRide() {
  const defaultPickupDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d;
  }, []);

  const minPickupDate = useMemo(
    () => toDateValue(new Date()),
    []
  );

  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [pickupDate, setPickupDate] = useState(
    toDateValue(defaultPickupDateTime)
  );
  const [pickupTime, setPickupTime] = useState(
    toTimeValue(defaultPickupDateTime)
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const issues: string[] = [];
    const pickupDateTime = new Date(
      `${pickupDate}T${pickupTime}`
    );

    if (!pickupLocation.trim())
      issues.push('Enter a pickup location');
    if (!dropLocation.trim())
      issues.push('Enter a drop location');
    if (
      !pickupDate ||
      !pickupTime ||
      Number.isNaN(pickupDateTime.getTime())
    ) {
      issues.push('Select a valid pickup date and time');
    }

    if (issues.length > 0) {
      toast.error(issues[0]);
      return;
    }

    toast.success(
      'Ride request received. We will confirm shortly.'
    );

    setPickupLocation('');
    setDropLocation('');
    setPickupDate(toDateValue(defaultPickupDateTime));
    setPickupTime(toTimeValue(defaultPickupDateTime));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
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
      <main className="mx-auto max-w-6xl space-y-12 px-4 pb-12">
        <section className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="absolute right-8 top-8 h-[80%] w-44 rounded-2xl bg-gradient-to-b from-yellow-200 to-yellow-400" />

          <div className="relative grid gap-10 p-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <h1 className="text-3xl font-semibold text-black sm:text-4xl">
                Schedule your next ride
              </h1>

              <form
                onSubmit={handleSubmit}
                className="
                  w-full
                  max-w-sm
                  space-y-4
                  rounded-xl
                  bg-white
                  p-5
                  border
                  border-black/10
                  shadow-sm
                "
              >
                <div className="relative pl-6">
                  <span className="absolute left-2 top-4 h-[calc(100%-2rem)] w-px bg-yellow-200" />
                  <span className="absolute left-1.5 top-4 h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="absolute left-1.5 bottom-4 h-2 w-2 rounded-full bg-yellow-500" />

                  <div className="space-y-3">
                    <BookingField
                      icon={<MapPin size={16} />}
                      placeholder="Pick Up Location"
                      value={pickupLocation}
                      onChange={setPickupLocation}
                    />
                    <BookingField
                      icon={<MapPinOff size={16} />}
                      placeholder="Drop Location"
                      value={dropLocation}
                      onChange={setDropLocation}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <BookingField
                    label="Pickup Date"
                    icon={<CalendarDays size={16} />}
                    type="date"
                    min={minPickupDate}
                    placeholder="Select date"
                    value={pickupDate}
                    onChange={setPickupDate}
                  />
                  <BookingField
                    label="Pickup Time"
                    icon={<Clock size={16} />}
                    type="time"
                    placeholder="Select time"
                    value={pickupTime}
                    onChange={setPickupTime}
                  />
                </div>

                <button
                  type="submit"
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    bg-yellow-400
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    text-black
                    transition
                    hover:bg-yellow-500
                  "
                >
                  Book Ride
                </button>
              </form>
            </div>

            <div className="relative flex justify-center">
              <RidePath className="pointer-events-none absolute -top-6 w-full max-w-md opacity-40" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

