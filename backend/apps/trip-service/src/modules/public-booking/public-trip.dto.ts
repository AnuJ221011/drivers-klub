export interface PublicTripPricingRequest {
  // Location details
  pickupLocation: string;
  dropLocation: string;

  // Date and time
  tripDate: string; // ISO date string
  tripTime: string; // Time in HH:mm format or ISO datetime

  // Trip details
  tripType: "AIRPORT" | "RENTAL" | "INTER_CITY";
  
  // Vehicle (optional, defaults to EV)
  vehicleType?: "EV" | "NON_EV";
  vehicleSku?: string;
}

export interface PublicTripPricingResponse {
  success: boolean;
  data: {
    vehicleSku: string;
    vehicleType: String;
    tripType: String;
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
    currency: string;
  };
  message: string;
}

export interface PublicCreateTripRequest {
  // Location details
  pickupLocation: string;
  dropLocation: string;

  // Date and time
  tripDate: string; // ISO date string
  tripTime: string; // Time in HH:mm format or ISO datetime

  // Trip details
  tripType: "AIRPORT" | "RENTAL" | "INTER_CITY";
  
  // Vehicle (optional, defaults to EV)
  vehicleType?: "EV" | "NON_EV";
  vehicleSku?: string;

  // Customer details
  customerName: string;
  customerPhone: string;
}

export interface PublicCreateTripResponse {
  success: boolean;
  data: {
    tripId: string;
    status: string;
    vehicleSku: String;
    vehilceType: String;
    tripType: String;
    price: number;
    pickupLocation: string;
    dropLocation: string;
    tripDate: string;
    customerName: string;
    customerPhone: string;
  };
  message: string;
}

