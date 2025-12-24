export type TripStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

// This represents the backend "Ride" entity (current /trips domain)
export type TripEntity = {
  id: string;
  fleetId: string | null;
  tripType: 'AIRPORT' | 'RENTAL' | 'INTER_CITY';
  originCity: string;
  destinationCity: string;
  pickupTime: string; // ISO date-time
  distanceKm: number;
  billableKm: number;
  ratePerKm: number;
  price: number;
  vehicleSku: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
};