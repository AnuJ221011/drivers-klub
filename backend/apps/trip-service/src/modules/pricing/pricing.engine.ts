import {
    PRICE_PER_KM,
    MIN_BILLABLE_KM,
    TRIP_TYPE_MULTIPLIER,
    BOOKING_TIME_MULTIPLIER,
    VEHICLE_MULTIPLIER,
} from "./pricing.config.js";
import { getBookingBucket } from "./pricing.utils.js";
import { PricingInput, PricingResult } from "./pricing.types.js";

export class PricingEngine {
    static calculateFare(input: PricingInput): PricingResult {
        const billableKm = Math.max(
            Math.ceil(input.distanceKm),
            MIN_BILLABLE_KM
        );

        const distanceFare = billableKm * PRICE_PER_KM;

        const tripMultiplier =
            TRIP_TYPE_MULTIPLIER[input.tripType];

        const bookingBucket = getBookingBucket(
            input.bookingTime,
            input.pickupTime
        );

        const bookingMultiplier =
            BOOKING_TIME_MULTIPLIER[bookingBucket];

        const vehicleMultiplier =
            VEHICLE_MULTIPLIER[input.vehicleType];

        const finalFare =
            distanceFare *
            tripMultiplier *
            bookingMultiplier *
            vehicleMultiplier;

        return {
            baseFare: distanceFare,
            finalFare: Math.round(finalFare),
            breakdown: {
                distanceFare,
                tripTypeMultiplier: tripMultiplier,
                bookingTimeMultiplier: bookingMultiplier,
                vehicleMultiplier,
            },
        };
    }
}
