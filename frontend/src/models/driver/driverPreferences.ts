export type DriverPreferenceKey =
  | 'accept_rentals'
  | 'prefer_day_shift'
  | 'accept_outstation'
  | 'auto_assign_rides'
  | 'auto_deduct_loans'
  | 'prefer_night_shift'
  | 'prefer_short_trips'
  | 'auto_deduct_savings'
  | 'enable_rental_model'
  | 'prefer_airport_rides';

export type DriverPreference = Record<DriverPreferenceKey, boolean>;

export type DriverPreferenceChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DriverPreferenceChangeRequest = {
  id: string;
  shortId?: string | null;
  driverId: string;
  driverShortId?: string | null;
  currentPreference: DriverPreference;
  requestedPreference: Partial<DriverPreference>;
  status: DriverPreferenceChangeRequestStatus;
  requestAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
};

export const DEFAULT_DRIVER_PREFERENCE: DriverPreference = {
  accept_rentals: false,
  prefer_day_shift: false,
  accept_outstation: false,
  auto_assign_rides: false,
  auto_deduct_loans: false,
  prefer_night_shift: false,
  prefer_short_trips: false,
  auto_deduct_savings: false,
  enable_rental_model: false,
  prefer_airport_rides: false,
};

export const DRIVER_PREFERENCE_LABEL: Record<DriverPreferenceKey, string> = {
  prefer_airport_rides: 'Prefer airport rides',
  accept_rentals: 'Accept rentals',
  auto_assign_rides: 'Auto assign on rapido',
  prefer_short_trips: 'Prefer shorter trips',
  accept_outstation: 'Accept outstation',
  enable_rental_model: 'Enable rental model',
  auto_deduct_loans: 'Auto deduct loans',
  auto_deduct_savings: 'Auto deduct savings',
  prefer_night_shift: 'Prefer night shift',
  prefer_day_shift: 'Prefer day shift',
};

export const DRIVER_PREFERENCE_GROUPS: Array<{
  title: string;
  keys: DriverPreferenceKey[];
}> = [
  {
    title: 'Trip Preferences',
    keys: [
      'prefer_airport_rides',
      'accept_rentals',
      'auto_assign_rides',
      'prefer_short_trips',
      'accept_outstation',
    ],
  },
  {
    title: 'Payout Preferences',
    keys: ['enable_rental_model', 'auto_deduct_loans', 'auto_deduct_savings'],
  },
  {
    title: 'Shift Preferences',
    keys: ['prefer_night_shift', 'prefer_day_shift'],
  },
];

