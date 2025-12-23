import { TripType } from "@prisma/client";

export type PricingInput = {
  distanceKm: number;
  tripType: TripType;
  pickupTime: Date;
  bookingTime: Date;
  vehicleType: "EV" | "NON_EV";
};

export type PricingResult = {
  baseFare: number;
  finalFare: number;
  breakdown: {
    distanceFare: number;
    tripTypeMultiplier: number;
    bookingTimeMultiplier: number;
    vehicleMultiplier: number;
  };
};
