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
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  bookingType?: "PREBOOK" | "INSTANT";
  vehicleType?: "EV" | "NON_EV";
  requestedVehicleType?: string;
  passengerName?: string;
  passengerPhone?: string;
  providerMeta?: Record<string, unknown>;
}
