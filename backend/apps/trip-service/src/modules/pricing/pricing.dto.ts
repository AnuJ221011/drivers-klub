export interface PricingPreviewRequest {
  distanceKm: number;
  bookingDate: string; // ISO
  tripDate: string;    // ISO
  originCity: string;
  tripType: "AIRPORT";
  vehicleSku: "TATA_TIGOR_EV";
}

export interface PricingPreviewResponse {
  billableDistanceKm: number;
  ratePerKm: number;
  baseFare: number;
  totalFare: number;
  currency: "INR";
}
