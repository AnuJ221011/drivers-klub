export interface CreateTripRequest {
  distanceKm: number;
  bookingDate: string;
  tripDate: string;
  originCity: string;
  destinationCity?: string;
  pickupLocation?: string;
  dropLocation?: string;
  tripType: "AIRPORT" | "INTER_CITY" | "RENTAL";
  vehicleSku: string;
}
