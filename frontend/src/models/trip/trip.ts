/**
 * Trip entity as returned by the backend Ride model (admin trips APIs).
 * NOTE: This differs from the old "Trip" model used earlier in the project.
 */
export type TripStatus =
  | 'CREATED'
  | 'BLOCKED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'DRIVER_ASSIGNED'
  | 'CANCELLED_BY_PARTNER'
  // Keep forward-compatible with new/unknown statuses
  | (string & {});

export type TripType = 'AIRPORT' | 'RENTAL' | 'INTER_CITY' | (string & {});

export type TripEntity = {
  id: string;

  tripType: TripType;
  status: TripStatus;

  originCity: string;
  destinationCity: string;

  pickupLocation: string | null;
  dropLocation: string | null;
  pickupTime: string;

  distanceKm: number;
  price: number | null;

  createdAt: string;
  updatedAt?: string;
};