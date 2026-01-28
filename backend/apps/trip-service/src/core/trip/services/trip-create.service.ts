import { PricingEngine } from "../../../modules/pricing/pricing.engine.js";
import { MIN_BILLABLE_KM, PRICE_PER_KM } from "../../../modules/pricing/pricing.config.js";
import { ConstraintEngine } from "../../constraints/constraint.engine.js";
import { TripValidator } from "../validators/trip.validator.js";
import { prisma } from "@driversklub/database";
import { CreateTripRequest } from "../../../modules/trips/trip.create.dto.js";
import { TripType } from "@prisma/client";
import { IdUtils, EntityType } from "@driversklub/common";

export class TripCreateService {
    static async create(input: CreateTripRequest) {
        // Validate city and vehicle constraints
        TripValidator.validateCity(input.originCity);
        TripValidator.validateVehicle(input.vehicleSku);

        const isPrebook = input.bookingType
            ? input.bookingType === "PREBOOK"
            : true;

        const resolvedVehicleType =
            input.vehicleType ||
            (input.vehicleSku.toUpperCase().includes("EV") ? "EV" : "NON_EV");

        // Apply constraint engine rules (T-1 booking, distance limits, etc.)
        const constraintResult = ConstraintEngine.validate({
            tripType: input.tripType as TripType,
            pickupTime: new Date(input.tripDate),
            distanceKm: input.distanceKm,
            vehicleType: resolvedVehicleType,
            isPrebook,
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
            vehicleType: resolvedVehicleType,
        });

        const billableKm = Math.max(
            Math.ceil(input.distanceKm),
            MIN_BILLABLE_KM
        );

        // Persist trip to database
        const providerMeta = {
            ...(input.providerMeta || {}),
        } as Record<string, unknown>;

        if (input.passengerName) providerMeta.passengerName = input.passengerName;
        if (input.passengerPhone) providerMeta.passengerPhone = input.passengerPhone;
        if (input.bookingType) providerMeta.bookingType = input.bookingType;
        if (input.requestedVehicleType) {
            providerMeta.requestedVehicleType = input.requestedVehicleType;
        }
        if (input.vehicleType) providerMeta.vehicleType = input.vehicleType;

        const hasProviderMeta = Object.keys(providerMeta).length > 0;
        const toOptionalNumber = (value?: number) =>
            typeof value === "number" ? value : undefined;

        const shortId = await IdUtils.generateShortId(prisma, EntityType.TRIP);

        const rideData: any = {
            shortId,
            tripType: input.tripType as TripType,
            originCity: input.originCity,
            destinationCity: input.destinationCity || "Unknown",
            pickupLocation: input.pickupLocation,
            dropLocation: input.dropLocation,
            pickupLat: toOptionalNumber(input.pickupLat),
            pickupLng: toOptionalNumber(input.pickupLng),
            dropLat: toOptionalNumber(input.dropLat),
            dropLng: toOptionalNumber(input.dropLng),
            pickupTime: new Date(input.tripDate),
            distanceKm: input.distanceKm,
            billableKm,
            ratePerKm: PRICE_PER_KM,
            price: pricing.finalFare,
            vehicleSku: input.vehicleSku,
            status: "CREATED",
        };

        if (hasProviderMeta) {
            rideData.providerMeta = providerMeta as any;
        }

        return prisma.ride.create({
            data: rideData,
        });
    }
}
