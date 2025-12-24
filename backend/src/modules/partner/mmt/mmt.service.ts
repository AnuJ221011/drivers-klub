import { prisma } from "../../../utils/prisma.js";
import { PricingEngine } from "../../../core/pricing/pricing.engine.js";
import { TripType } from "@prisma/client";

export class MMTService {

    // 1. SEARCH FARE
    async searchFare(input: any) {
        // Input: { pickupCity, dropCity, pickupTime, tripType }
        const pickupTime = new Date(input.pickupTime);
        const now = new Date();

        // Rule 1: T+1 Only (24 hours advance notice roughly, or next calendar day)
        // Strict interpretation: Must be >= 24h from now OR next calendar day. Using simple 24h for clear V1.
        // User said: "accept rides 1 day and before".
        const hoursDiff = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            throw new Error("MMT V1 Restriction: Only rides > 24h in advance are accepted.");
        }

        // Rule 2: Airport Only (P1)
        if (input.tripType !== "AIRPORT") {
            throw new Error("MMT V1 Restriction: Only AIRPORT trips are accepted.");
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
        // Input: { mmtRefId, skuId, ...details }
        // Create Trip with BLOCKED status

        // Ensure SKU is valid
        if (input.skuId !== "TATA_TIGOR_EV") throw new Error("Invalid SKU");

        // Create barebones trip
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

    // 3. PAID (CONFIRM)
    async confirmPaid(input: any) {
        // Input: { bookingId, paymentDetails }

        const trip = await prisma.ride.findUnique({ where: { id: input.bookingId } });
        if (!trip) throw new Error("Booking not found");

        if (trip.status !== "BLOCKED") throw new Error("Booking is not in blocked state");

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
