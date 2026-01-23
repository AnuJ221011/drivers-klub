export interface PricingPreviewRequest {
  // Location-based (for Google Maps)
  pickup?: string;
  drop?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;

  // Fallback distance
  distanceKm?: number;

  // Trip details
  bookingDate: string; // ISO
  tripDate: string;    // ISO
  tripType: "AIRPORT" | "RENTAL" | "INTER_CITY";

  // Vehicle specification (supports both formats)
  vehicleType?: "EV" | "NON_EV";
  vehicleSku?: "TATA_TIGOR_EV" | string;  // For backward compatibility
}

export interface PricingPreviewResponse {
  distanceSource: "GOOGLE_MAPS" | "CLIENT_PROVIDED";
  distanceKm: number;
  billableDistanceKm: number;
  ratePerKm: number;
  baseFare: number;
  totalFare: number;
  breakdown: {
    distanceFare: number;
    tripTypeMultiplier: number;
    bookingTimeMultiplier: number;
    vehicleMultiplier: number;
  };
  currency: "INR";
}