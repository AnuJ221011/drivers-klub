export type TripStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | (string & {});

export type TripType =
  | 'RENTAL'
  | 'OUTSTATION'
  | 'LOCAL'
  | 'AIRPORT'
  | (string & {});

export type ProviderType = 'MOJOBOXX' | 'MMT' | 'INTERNAL' | (string & {});

export type ProviderMapping = {
  id: string;
  rideId: string;
  providerType: ProviderType;
  providerStatus?: string | null;
  externalBookingId?: string | null;
  providerBookingId?: string | null;
  rawPayload?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type TripAssignment = {
  id: string;
  driverId?: string | null;
  vehicleId?: string | null;
  status?: string;
  startTime?: string;
  endTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Backend trip response shape (kept permissive/forward-compatible).
 * Some older UI code used `pickup/drop/fare/driverId/vehicleId/assignmentId` — those are kept optional.
 */
export type TripEntity = {
  id: string;

  // Fleet / dispatch context (may or may not be present on list responses)
  fleetId?: string | null;

  // Route & timing
  tripDate?: string | null;
  pickupTime?: string | null;
  pickupLocation?: string | null;
  dropLocation?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropLat?: number | null;
  dropLng?: number | null;
  originCity?: string | null;
  destinationCity?: string | null;
  distanceKm?: number | null;
  billableKm?: number | null;

  // Fare
  price?: number | null;
  ratePerKm?: number | null;

  // Provider / fulfillment
  provider?: string | null;
  providerBookingId?: string | null;
  providerStatus?: string | null;
  providerRideStatus?: string | null;
  providerMeta?: unknown;
  providerMapping?: ProviderMapping | null;

  // Trip metadata
  tripType?: TripType | null;
  status: TripStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  vehicleSku?: string | null;
  createdAt: string;
  updatedAt?: string;

  // Assignments (some list APIs include it inline)
  tripAssignments?: TripAssignment[];

  // Legacy fields (older UI)
  pickup?: string;
  drop?: string | null;
  fare?: number | null;
  driverId?: string;
  vehicleId?: string;
  assignmentId?: string;
};