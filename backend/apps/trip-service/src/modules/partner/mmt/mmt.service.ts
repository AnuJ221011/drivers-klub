import { prisma } from "@driversklub/database";
import { PricingEngine } from "../../pricing/pricing.engine.js";
import { TripType } from "@prisma/client";
import { ApiError } from "@driversklub/common";

import { MMTSearchResponse } from "./mmt.types";

export class MMTService {

    // 1. SEARCH FARE
    async searchFare(input: any): Promise<MMTSearchResponse> {
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
            // Instead of error, returning empty availability might be better, but strict error as per current logic
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

        // Construct Full MMT Response
        return {
            response: {
                distance_booked: distanceKm,
                is_instant_search: false,
                is_instant_available: true,
                start_time: input.pickupTime,
                is_part_payment_allowed: true,
                communication_type: "PRE", // Driver details sent before trip
                verification_type: "OTP",
                airport_tags: ["AP"], // Defaulting to Airport Pickup for now? Logic typically needs detection. 
                // However, input mapping sets airportType. Let's use it if available or default 'AP' if origin is airport.
                // For simplicity in V1 for AIRPORT trip type:
                // If we don't differentiate yet, 'AP' (Pickup) or 'AD' (Drop) depends on logic. 
                // input.airportType is passed from controller.

                car_types: [
                    {
                        sku_id: "TATA_TIGOR_EV",
                        type: "sedan", // Tigor is sedan
                        subcategory: "basic",
                        combustion_type: "Electric",
                        model: "Tata Tigor", // Must match allowed values or be specific
                        carrier: false,
                        make_year_type: "Newer",
                        make_year: 2024,
                        cancellation_rule: "SUPER_FLEXI",
                        min_payment_percentage: 100,
                        pax_capacity: 4,
                        luggage_capacity: 2,
                        zero_payment: true, // Mandatory flag for V3
                        amenities: {
                            features: {
                                vehicle: ["AC", "Music System", "Charging Point"],
                                driver: ["Vaccinated", "Mask"],
                                services: []
                            }
                        },
                        fare_details: {
                            base_fare: price.baseFare,
                            per_km_charge: Math.round(price.finalFare / distanceKm), // Approx per km
                            per_km_extra_charge: 20, // Example fixed rate
                            total_driver_charges: 0,
                            seller_discount: 0,
                            extra_charges: {
                                night_charges: {
                                    amount: 0,
                                    is_included_in_base_fare: false,
                                    is_included_in_grand_total: false,
                                    is_applicable: false
                                },
                                toll_charges: {
                                    amount: 0,
                                    is_included_in_base_fare: false,
                                    is_included_in_grand_total: false, // Excluded usually means pay on actuals
                                    is_applicable: true
                                },
                                state_tax: {
                                    amount: 0,
                                    is_included_in_base_fare: false,
                                    is_included_in_grand_total: false,
                                    is_applicable: true
                                },
                                parking_charges: {
                                    amount: 0,
                                    is_included_in_base_fare: false,
                                    is_included_in_grand_total: false,
                                    is_applicable: true
                                },
                                waiting_charges: {
                                    amount: 100, // Rs 100 per 30 mins
                                    free_waiting_time: 45,
                                    applicable_time: 30,
                                    is_applicable: true
                                },
                                airport_entry_fee: {
                                    amount: 0,
                                    is_included_in_base_fare: false,
                                    is_included_in_grand_total: false,
                                    is_applicable: true
                                }
                            }
                        }
                    }
                ]
            }
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

        const pickupTime = new Date(input.pickupTime);
        if (isNaN(pickupTime.getTime())) {
            throw new ApiError(400, "Invalid pickupTime format");
        }

        const now = new Date();

        // Rule: T+1 Only (24 hours advance notice) - same validation as searchFare
        const hoursDiff = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            throw new ApiError(400, "MMT V1 Restriction: Only rides > 24h in advance are accepted.");
        }

        const distanceKm = input.distanceKm || 40; // Fallback to default

        // Calculate price dynamically using PricingEngine (same as searchFare)
        const priceResult = PricingEngine.calculateFare({
            distanceKm,
            tripType: "AIRPORT",
            vehicleType: "EV",
            bookingTime: now,
            pickupTime
        });

        // Generate dynamic OTP
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

        const trip = await prisma.ride.create({
            data: {
                tripType: TripType.AIRPORT,
                originCity: input.pickupCity || "DELHI",
                destinationCity: input.dropCity || "Unknown",
                pickupTime: pickupTime,
                distanceKm: distanceKm,
                billableKm: distanceKm,
                ratePerKm: distanceKm > 0 ? Math.round(priceResult.finalFare / distanceKm) : 0,
                price: priceResult.finalFare,
                vehicleSku: "TATA_TIGOR_EV",
                status: "BLOCKED",
                providerMeta: {
                    otp: verificationCode
                },
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
            response: {
                success: true,
                order_reference_number: trip.id,
                status: "BLOCKED",
                verification_code: verificationCode
            }
        };
    }

    async confirmPaid(input: any) {
        const bookingId = input.bookingId || input.order_reference_number;
        const trip = await prisma.ride.findUnique({ where: { id: bookingId } });
        if (!trip) throw new ApiError(404, "Booking not found");

        if (trip.status !== "BLOCKED") throw new ApiError(400, "Booking is not in blocked state");

        const updated = await prisma.ride.update({
            where: { id: bookingId },
            data: {
                status: "CREATED", // Confirmed!
                providerStatus: "CONFIRMED"
            }
        });

        return {
            response: {
                success: true,
                order_reference_number: updated.id,
                status: "CONFIRMED"
            }
        };
    }

    // 4. CANCEL
    // 4. CANCEL
    async cancelRide(input: any) {
        const bookingId = input.bookingId || input.order_reference_number;
        const trip = await prisma.ride.findUnique({ where: { id: bookingId } });
        if (!trip) throw new Error("Booking not found");

        const updated = await prisma.ride.update({
            where: { id: bookingId },
            data: {
                status: "CANCELLED_BY_PARTNER"
            }
        });

        return {
            response: {
                success: true
            }
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

        // Generate new OTP for the rescheduled ride
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Persist pending reschedule time and new OTP in providerMeta
        const currentMeta = (trip.providerMeta as Record<string, any>) || {};
        await prisma.ride.update({
            where: { id: bookingId },
            data: {
                pendingRescheduleTime: newPickupTime,
                providerMeta: {
                    ...currentMeta,
                    rescheduleOtp: verificationCode
                }
            }
        });

        // Fetch assigned driver details if any
        // Assignments use AssignmentStatus enum: ASSIGNED, ACTIVE (on-going)
        const activeAssignment = await prisma.tripAssignment.findFirst({
            where: {
                tripId: bookingId,
                status: { in: ['ASSIGNED', 'ACTIVE'] }
            },
            include: {
                driver: {
                    include: { user: true }
                }
            }
        });

        let driverDetails = null;
        if (activeAssignment?.driver) {
            driverDetails = {
                name: `${activeAssignment.driver.firstName} ${activeAssignment.driver.lastName || ''}`.trim(),
                mobile: activeAssignment.driver.mobile,
                lat: 0, // Placeholder
                lng: 0
            };
        }

        return {
            response: {
                success: true,
                verification_code: verificationCode,
                fare_details: {
                    total_amount: trip.price,
                    payable_amount: trip.price // Assuming no price change for reschedule logic V1
                },
                driver_details: driverDetails
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

    // 7. BOOKING DETAILS
    async getBookingDetails(bookingId: string, isExternalRef: boolean = false) {
        let trip;
        let externalRefId: string | null = null;

        if (isExternalRef) {
            // Search by MMT external reference ID
            const mapping = await prisma.rideProviderMapping.findFirst({
                where: { externalBookingId: bookingId },
                include: { ride: true }
            });
            trip = mapping?.ride;
            externalRefId = mapping?.externalBookingId || null;
        } else {
            // Search by our internal booking ID
            trip = await prisma.ride.findUnique({
                where: { id: bookingId },
                include: { providerMapping: true }
            });
            externalRefId = trip?.providerMapping?.externalBookingId || null;
        }

        if (!trip) throw new ApiError(404, "Booking not found");

        // Fetch driver details if assigned
        const activeAssignment = await prisma.tripAssignment.findFirst({
            where: {
                tripId: trip.id,
                status: { in: ['ASSIGNED', 'ACTIVE'] }
            },
            include: {
                driver: true
            }
        });

        let driverDetails = null;
        if (activeAssignment?.driver) {
            // Fetch the driver's active vehicle assignment
            const vehicleAssignment = await prisma.assignment.findFirst({
                where: {
                    driverId: activeAssignment.driver.id,
                    status: 'ACTIVE'
                },
                include: {
                    vehicle: true
                }
            });

            driverDetails = {
                name: `${activeAssignment.driver.firstName} ${activeAssignment.driver.lastName || ''}`.trim(),
                phone: activeAssignment.driver.mobile,
                vehicle: vehicleAssignment?.vehicle?.vehicleNumber || null
            };
        }

        // Map internal status to MMT status enum
        let mmtStatus = "CONFIRMED";
        if (trip.status === "CANCELLED_BY_PARTNER" || trip.status === "CANCELLED") {
            mmtStatus = "CANCELLED";
        } else if (trip.status === "COMPLETED") {
            mmtStatus = "TRAVELLED";
        } else if (trip.status === "BLOCKED") {
            mmtStatus = "HOLD";
        } else if (trip.status === "CREATED" || trip.status === "DRIVER_ASSIGNED" || trip.status === "STARTED") {
            mmtStatus = "CONFIRMED";
        } else if (trip.status === "NO_SHOW") {
            mmtStatus = "NOT_TRAVELLED";
        }

        const verificationCode = (trip.providerMeta as any)?.otp || null;

        return {
            response: {
                status: mmtStatus,
                failure_reason: null, // Only for FAILURE status
                reference_number: externalRefId || "UNKNOWN",
                verification_code: verificationCode,
                // Optional extras often requested but not strictly in the minimal spec:
                booking_id: trip.id,
                driver: driverDetails
            },
            error: null,
            code: null
        };
    }
}
