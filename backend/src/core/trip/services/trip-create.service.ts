import { PricingEngine } from "@/core/pricing/pricing.engine.js";
import { MIN_BILLABLE_KM, PRICE_PER_KM } from "@/core/pricing/pricing.config.js";
import { ConstraintEngine } from "@/core/constraints/constraint.engine.js";
import { TripValidator } from "../validators/trip.validator.js";
import { prisma } from "@/utils/prisma.js";
import { CreateTripRequest } from "@/modules/trips/trip.create.dto.js";
import { TripType } from "@prisma/client";

export class TripCreateService {
  static async create(input: CreateTripRequest) {
    // Validate city and vehicle constraints
    TripValidator.validateCity(input.originCity);
    TripValidator.validateVehicle(input.vehicleSku);

    // Apply constraint engine rules (T-1 booking, distance limits, etc.)
    const constraintResult = ConstraintEngine.validate({
      tripType: input.tripType as TripType,
      pickupTime: new Date(input.tripDate),
      distanceKm: input.distanceKm,
      vehicleType: "EV",
      isPrebook: true,
      originCity: input.originCity
    });

    if (!constraintResult.allowed) {
      throw new Error(constraintResult.reason);
    }

    // Calculate pricing based on distance, trip type, and timing
    const pricing = PricingEngine.calculateFare({
      distanceKm: input.distanceKm,
      tripType: input.tripType as TripType,
      pickupTime: new Date(input.tripDate),
      bookingTime: new Date(input.bookingDate),
      vehicleType: "EV",
    });

    const billableKm = Math.max(
      Math.ceil(input.distanceKm),
      MIN_BILLABLE_KM
    );

    // Persist trip to database
    return prisma.ride.create({
      data: {
        tripType: input.tripType as TripType,
        originCity: input.originCity,
        destinationCity: input.destinationCity || "Unknown",
        pickupLocation: input.pickupLocation,
        dropLocation: input.dropLocation,
        pickupTime: new Date(input.tripDate),
        distanceKm: input.distanceKm,
        billableKm,
        ratePerKm: PRICE_PER_KM,
        price: pricing.finalFare,
        vehicleSku: input.vehicleSku,
        status: "CREATED",
      },
    });
  }
}
