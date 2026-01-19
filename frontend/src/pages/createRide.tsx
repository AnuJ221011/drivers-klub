import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';

import { CalendarDays, Clock, MapPin, MapPinOff, Search } from 'lucide-react';

function toDateValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
    <label className="block space-y-1 text-xs font-medium text-[#6b5a45]">
      {label ? <span>{label}</span> : null}
      <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-3 py-2 shadow-sm">
        <span className="text-yellow-600">{icon}</span>
        <input
          type={type}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-[#4a3b2a] placeholder:text-[#9c8c79] focus:outline-none"
        />
      </div>
    </label>
  );
}

function RidePath({ className = '' }: { className?: string }) {
  const ridePath = 'M24 210 C 120 160 210 200 290 130 C 340 85 375 60 400 35';

  return (
    <svg className={className} viewBox="0 0 420 250" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="rideGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2c259" />
          <stop offset="100%" stopColor="#b87a2f" />
        </linearGradient>
      </defs>
      <path
        d={ridePath}
        className="route-path-base"
        stroke="#e1c48a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={ridePath}
        className="route-path-dash"
        stroke="url(#rideGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g className="route-car">
        <g transform="translate(-12 -8)">
          <rect x="0" y="6" width="24" height="8" rx="4" fill="#2d2417" />
          <rect x="6" y="2" width="10" height="6" rx="3" fill="#f8d783" />
          <circle cx="6" cy="14" r="2.2" fill="#1f1b16" />
          <circle cx="18" cy="14" r="2.2" fill="#1f1b16" />
        </g>
        <animateMotion dur="6s" repeatCount="indefinite" rotate="auto" path={ridePath} />
      </g>
    </svg>
  );
}

export default function CreateRide() {
  const defaultPickupDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d;
  }, []);

  const minPickupDate = useMemo(() => toDateValue(new Date()), []);

  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [pickupDate, setPickupDate] = useState(toDateValue(defaultPickupDateTime));
  const [pickupTime, setPickupTime] = useState(toTimeValue(defaultPickupDateTime));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const issues: string[] = [];
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);

    if (!pickupLocation.trim()) issues.push('Enter a pickup location');
    if (!dropLocation.trim()) issues.push('Enter a drop location');
    if (!pickupDate || !pickupTime || Number.isNaN(pickupDateTime.getTime())) {
      issues.push('Select a valid pickup date and time');
    }

    if (issues.length > 0) {
      toast.error(issues[0]);
      return;
    }

    toast.success('Ride request received. We will confirm shortly.');
    setPickupLocation('');
    setDropLocation('');
    setPickupDate(toDateValue(defaultPickupDateTime));
    setPickupTime(toTimeValue(defaultPickupDateTime));
  }

  return (
    <div className="min-h-screen bg-[#f1e7d6]">
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes routeDot {
          0% { top: 14px; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: calc(100% - 14px); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248, 211, 115, 0.45); }
          50% { box-shadow: 0 0 0 8px rgba(248, 211, 115, 0); }
        }
        @keyframes routeDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -48; }
        }
        .float-card { animation: floatCard 7s ease-in-out infinite; }
        .route-dot { position: absolute; animation: routeDot 3.2s ease-in-out infinite; }
        .pulse-ring { animation: glowPulse 2.4s ease-out infinite; }
        .route-path-base { opacity: 0.35; }
        .route-path-dash { stroke-dasharray: 6 12; animation: routeDash 3.4s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .float-card, .route-dot, .pulse-ring, .route-path-dash { animation: none; }
          .route-car { display: none; }
        }
      `}</style>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-yellow-400 px-2 py-1 text-xs font-semibold text-black">
            <img src="../../assets/images/logo-drivers-klub.png" alt="" />
          </span>
          <span className="text-sm font-semibold text-[#5b3a1d]">Driver&apos;s Klub</span>
        </div>
        
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 pb-12">
        <section className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[#efe3cf] shadow-sm">
          <div className="absolute right-8 top-8 h-[80%] w-44 rounded-2xl bg-gradient-to-b from-[#f8d783] to-[#f2c259]" />
          <div className="relative grid gap-10 p-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <h1 className="text-3xl font-semibold text-[#5b3a1d] sm:text-4xl">
                Schedule your next ride.
              </h1>

              <form
                onSubmit={handleSubmit}
                className="float-card w-full max-w-sm space-y-4 rounded-2xl bg-[#f6e3bd] p-5 shadow-[0_12px_24px_rgba(84,64,38,0.12)] transition hover:shadow-[0_18px_30px_rgba(84,64,38,0.2)]"
              >
                <div className="relative pl-6">
                  <span className="absolute left-2 top-4 h-[calc(100%-2rem)] w-px bg-[#e7c87e]" />
                  <span className="pulse-ring absolute left-1.5 top-4 h-2 w-2 rounded-full bg-[#2d2417]" />
                  <span className="absolute left-1.5 bottom-4 h-2 w-2 rounded-full bg-[#2d2417]" />
                  <span className="route-dot left-1.5 h-2 w-2 rounded-full bg-[#b87a2f]" />

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
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2d2417] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1f1810]"
                >
                  Book Ride
                </button>
              </form>
            </div>

            <div className="relative flex justify-center">
              <RidePath className="pointer-events-none absolute -top-6 w-full max-w-md opacity-80" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
