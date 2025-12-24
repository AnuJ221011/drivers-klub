import { PricingEngine } from "@/core/pricing/pricing.engine.js";
import { MIN_BILLABLE_KM, PRICE_PER_KM } from "@/core/pricing/pricing.config.js";
import { ConstraintEngine } from "@/core/constraints/constraint.engine.js";
import { TripValidator } from "../validators/trip.validator.js";
import { prisma } from "@/utils/prisma.js";
import { CreateTripRequest } from "@/modules/trips/trip.create.dto.js";
import { TripType } from "@prisma/client";

export class TripCreateService {
  static async create(input: CreateTripRequest) {
    // 1️ Validate constraints
    TripValidator.validateCity(input.originCity);
    TripValidator.validateVehicle(input.vehicleSku);

    // Use new ConstraintEngine
    const constraintResult = ConstraintEngine.validate({
      tripType: input.tripType as TripType, // Cast string to Enum
      pickupTime: new Date(input.tripDate), // Mapping input to logic
      distanceKm: input.distanceKm,
      vehicleType: "EV", // current SKU logic
      isPrebook: true, // Assuming all creates are prebooks for now or derived
      originCity: input.originCity
    });

    if (!constraintResult.allowed) {
      throw new Error(constraintResult.reason);
    }

    // 2 Pricing
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

    // 3️ Persist trip (Ride)
    return prisma.ride.create({
      data: {
        fleetId: input.fleetId,
        tripType: input.tripType as TripType,
        originCity: input.originCity,
        destinationCity: input.destinationCity ?? "Unknown",
        pickupTime: new Date(input.tripDate), // Renamed from tripDate
        distanceKm: input.distanceKm,
        billableKm,
        ratePerKm: PRICE_PER_KM,
        price: pricing.finalFare, // Renamed from totalFare, using pricing result
        vehicleSku: input.vehicleSku,
        status: "CREATED", // Explicitly set default if needed
      },
    });
  }
}
