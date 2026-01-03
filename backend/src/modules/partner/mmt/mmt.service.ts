import { prisma } from "../../../utils/prisma.js";
import { PricingEngine } from "../../../core/pricing/pricing.engine.js";
import { TripType } from "@prisma/client";
import { ApiError } from "../../../utils/apiError.js";

export class MMTService {

    // 1. SEARCH FARE
    async searchFare(input: any) {
        // Input validation
        if (!input.pickupTime) {
            throw new ApiError(400, "pickupTime is required");
        }
        if (!input.tripType) {
            throw new ApiError(400, "tripType is required");
        }

        const pickupTime = new Date(input.pickupTime);
        if (isNaN(pickupTime.getTime())) {
            throw new ApiError(400, "Invalid pickupTime format");
        }

        const now = new Date();

        // Rule 1: T+1 Only (24 hours advance notice)
        const hoursDiff = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            throw new ApiError(400, "MMT V1 Restriction: Only rides > 24h in advance are accepted.");
        }

        // Rule 2: Airport Only (P1)
        if (input.tripType !== "AIRPORT") {
            throw new ApiError(400, "MMT V1 Restriction: Only AIRPORT trips are accepted.");
        }

        const distanceKm = input.distanceKm || 40; // Fallback or strict requirement

        const price = PricingEngine.calculateFare({
            distanceKm,
            tripType: "AIRPORT",
            vehicleType: "EV", // Only supported vehicle
            bookingTime: now,
            pickupTime
        });

        return {
            available: true,
            skus: [
                {
                    id: "TATA_TIGOR_EV",
                    name: "Tata Tigor EV",
                    price: price.finalFare,
                    currency: "INR",
                    taxIncluded: true
                }
            ]
        };
    }

    // 2. BLOCK RIDE
    async blockRide(input: any) {
        // Input validation
        if (!input.skuId) {
            throw new ApiError(400, "skuId is required");
        }
        if (!input.mmtRefId) {
            throw new ApiError(400, "mmtRefId is required");
        }
        if (!input.pickupTime) {
            throw new ApiError(400, "pickupTime is required");
        }

        if (input.skuId !== "TATA_TIGOR_EV") throw new ApiError(400, "Invalid SKU");

        const trip = await prisma.ride.create({
            data: {
                tripType: TripType.AIRPORT,
                originCity: input.pickupCity || "DELHI", // default validation elsewhere
                destinationCity: input.dropCity || "Unknown",
                pickupTime: new Date(input.pickupTime),
                distanceKm: input.distanceKm || 0,
                billableKm: input.distanceKm || 0,
                ratePerKm: 0, // Set later or from pricing
                price: input.price || 0,
                vehicleSku: "TATA_TIGOR_EV",
                status: "BLOCKED", // The new Enum Value
                providerMapping: {
                    create: {
                        providerType: "MMT",
                        externalBookingId: input.mmtRefId,
                        providerStatus: "BLOCKED",
                        rawPayload: input
                    }
                }
            }
        });

        return {
            bookingId: trip.id,
            status: "BLOCKED",
            mmtRefId: input.mmtRefId
        };
    }

    async confirmPaid(input: any) {
        const trip = await prisma.ride.findUnique({ where: { id: input.bookingId } });
        if (!trip) throw new ApiError(404, "Booking not found");

        if (trip.status !== "BLOCKED") throw new ApiError(400, "Booking is not in blocked state");

        const updated = await prisma.ride.update({
            where: { id: input.bookingId },
            data: {
                status: "CREATED", // Confirmed!
                providerStatus: "CONFIRMED"
            }
        });

        return {
            bookingId: updated.id,
            status: "CONFIRMED"
        };
    }

    // 4. CANCEL
    async cancelRide(input: any) {
        const trip = await prisma.ride.findUnique({ where: { id: input.bookingId } });
        if (!trip) throw new Error("Booking not found");

        const updated = await prisma.ride.update({
            where: { id: input.bookingId },
            data: {
                status: "CANCELLED_BY_PARTNER"
            }
        });

        return {
            bookingId: updated.id,
            status: "CANCELLED"
        };
    }

    // 5. RESCHEDULE BLOCK (Check availability/validity)
    // 5. Reschedule Block Endpoint
    async rescheduleBlock(input: any) {
        // Official Spec:
        // Input: order_reference_number, start_time
        // Output: { response: { success: true, verification_code, fare_details, ... } }

        const bookingId = input.order_reference_number;
        const newPickupTimeStr = input.start_time;

        if (!bookingId) throw new ApiError(400, "order_reference_number is required");
        if (!newPickupTimeStr) throw new ApiError(400, "start_time is required");

        const trip = await prisma.ride.findUnique({ where: { id: bookingId } });
        if (!trip) throw new ApiError(404, "Booking not found");

        const newPickupTime = new Date(newPickupTimeStr);
        if (isNaN(newPickupTime.getTime())) throw new ApiError(400, "Invalid start_time format");

        // Validate time
        const now = new Date();
        const diff = newPickupTime.getTime() - now.getTime();
        // Example logic: must be at least 1 hour in future
        if (diff < 3600000) {
            throw new ApiError(400, "New pickup time must be at least 1 hour in the future");
        }

        // Validate Status
        if (trip.status === "COMPLETED" || trip.status === "CANCELLED_BY_PARTNER" || trip.status === "CANCELLED") {
            throw new ApiError(400, "Cannot reschedule a completed or cancelled ride");
        }

        // Persist pending reschedule time
        await prisma.ride.update({
            where: { id: bookingId },
            data: { pendingRescheduleTime: newPickupTime }
        });

        // Mock response data as per Official Spec
        return {
            response: {
                success: true,
                verification_code: "1234", // Mock or retrieve from trip
                fare_details: {
                    total_amount: trip.price, // Using existing price
                    payable_amount: trip.price
                },
                driver_details: {
                    name: "Test Driver",
                    mobile: "9999999999"
                }
            }
        };
    }

    // 6. Reschedule Confirm Endpoint
    async rescheduleConfirm(input: any) {
        // Official Spec:
        // Input: order_reference_number
        // Output: { response: { success: true } }

        const bookingId = input.order_reference_number;
        if (!bookingId) throw new ApiError(400, "order_reference_number is required");

        const trip = await prisma.ride.findUnique({ where: { id: bookingId } });
        if (!trip) throw new ApiError(404, "Booking not found");

        if (!trip.pendingRescheduleTime) {
            throw new ApiError(400, "No pending reschedule found. Call rescheduleblock first.");
        }

        // Apply Reschedule
        await prisma.ride.update({
            where: { id: bookingId },
            data: {
                pickupTime: trip.pendingRescheduleTime,
                pendingRescheduleTime: null, // Clear pending
                status: "CREATED", // Resets to created/confirmed state
                providerStatus: "CONFIRMED"
            }
        });

        return {
            response: {
                success: true
            }
        };
    }

    // 5. BOOKING DETAILS
    async getBookingDetails(bookingId: string) {
        const trip = await prisma.ride.findUnique({
            where: { id: bookingId },
            include: { providerMapping: true }
        });

        if (!trip) throw new Error("Booking not found");

        return {
            bookingId: trip.id,
            status: trip.status, // CREATED, BLOCKED, DRIVER_ASSIGNED, STARTED, etc.
            mmtRefId: trip.providerMapping?.externalBookingId,
            driverDetails: trip.status === "DRIVER_ASSIGNED" || trip.status === "STARTED" ? {
                // Fetch driver if needed, or return minimal info
                assigned: true
            } : null
        };
    }
}
