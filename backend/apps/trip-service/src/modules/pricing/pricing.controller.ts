import { Request, Response } from "express";
import { GoogleMapsAdapter } from "../../adapters/providers/google/google.adapter.js";
import { PricingEngine } from "./pricing.engine.js";
import { PricingInput } from "./pricing.types.js";
import { getBookingBucket } from "./pricing.utils.js";
import { TripType } from "@prisma/client";
import { logger } from "@driversklub/common";

export class PricingController {
    private googleMaps: GoogleMapsAdapter;

    constructor() {
        this.googleMaps = new GoogleMapsAdapter();
    }

    preview = async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                pickup,
                drop,
                tripType,
                tripDate,
                bookingDate,
                vehicleType,
                vehicleSku,
                distanceKm: clientDistanceKm,
                pickupLat,
                pickupLng,
                dropLat,
                dropLng,
            } = req.body;

            // Validate required fields
            if (!tripType || !tripDate || !bookingDate) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields: tripType, tripDate, bookingDate",
                });
                return;
            }

            // Determine vehicle type from vehicleType or vehicleSku
            let finalVehicleType: "EV" | "NON_EV";
            if (vehicleType) {
                finalVehicleType = vehicleType;
            } else if (vehicleSku) {
                // Map vehicleSku to vehicleType (TATA_TIGOR_EV -> EV)
                finalVehicleType = vehicleSku.includes("EV") ? "EV" : "NON_EV";
            } else {
                res.status(400).json({
                    success: false,
                    message: "Either vehicleType or vehicleSku is required",
                });
                return;
            }

            const toNumber = (value: unknown): number | undefined => {
                if (typeof value === "number" && Number.isFinite(value)) return value;
                if (typeof value === "string") {
                    const parsed = Number(value.trim());
                    if (!Number.isNaN(parsed)) return parsed;
                }
                return undefined;
            };

            const resolvedPickupLat = toNumber(pickupLat);
            const resolvedPickupLng = toNumber(pickupLng);
            const resolvedDropLat = toNumber(dropLat);
            const resolvedDropLng = toNumber(dropLng);

            let distanceKm = toNumber(clientDistanceKm);
            let distanceSource: "GOOGLE_MAPS" | "CLIENT_PROVIDED" = "CLIENT_PROVIDED";

            const hasCoords =
                resolvedPickupLat !== undefined &&
                resolvedPickupLng !== undefined &&
                resolvedDropLat !== undefined &&
                resolvedDropLng !== undefined;

            if (hasCoords) {
                logger.info("Attempting Google Maps distance calculation (coords)", {
                    pickupLat: resolvedPickupLat,
                    pickupLng: resolvedPickupLng,
                    dropLat: resolvedDropLat,
                    dropLng: resolvedDropLng
                });

                const googleResult = await this.googleMaps.getDistance(
                    { lat: resolvedPickupLat, lng: resolvedPickupLng },
                    { lat: resolvedDropLat, lng: resolvedDropLng }
                );

                if (googleResult) {
                    distanceKm = googleResult.distanceKm;
                    distanceSource = "GOOGLE_MAPS";
                    logger.info("Using Google Maps distance (coords)", {
                        distanceKm,
                        durationMins: googleResult.durationMins
                    });
                }
            }

            // Try to get distance from Google Maps if pickup and drop are provided
            if (distanceKm === undefined && pickup && drop) {
                logger.info("Attempting Google Maps distance calculation", { pickup, drop });

                const googleResult = await this.googleMaps.getDistance(pickup, drop);

                if (googleResult) {
                    distanceKm = googleResult.distanceKm;
                    distanceSource = "GOOGLE_MAPS";
                    logger.info("Using Google Maps distance", {
                        distanceKm,
                        durationMins: googleResult.durationMins
                    });
                }
            }

            if (distanceKm === undefined || !Number.isFinite(distanceKm) || distanceKm <= 0) {
                res.status(400).json({
                    success: false,
                    message: "Unable to calculate distance. Provide pickup/drop or distanceKm.",
                });
                return;
            }

            // Parse dates
            const pickupTime = new Date(tripDate);
            const bookingTime = new Date(bookingDate);

            // Prepare pricing input
            const pricingInput: PricingInput = {
                distanceKm,
                tripType: tripType as TripType,
                pickupTime,
                bookingTime,
                vehicleType: finalVehicleType,
            };

            // Calculate fare
            const pricing = PricingEngine.calculateFare(pricingInput);

            // Return response
            res.status(200).json({
                success: true,
                data: {
                    distanceSource,
                    distanceKm,
                    billableDistanceKm: Math.ceil(distanceKm),
                    ratePerKm: 25,
                    baseFare: pricing.baseFare,
                    totalFare: pricing.finalFare,
                    breakdown: {
                        distanceFare: pricing.breakdown.distanceFare,
                        tripTypeMultiplier: pricing.breakdown.tripTypeMultiplier,
                        bookingTimeMultiplier: pricing.breakdown.bookingTimeMultiplier,
                        vehicleMultiplier: pricing.breakdown.vehicleMultiplier,
                    },
                    currency: "INR",
                },
                message: "Fare calculated successfully",
            });
        } catch (error: any) {
            logger.error("Error in pricing preview", { error: error.message, stack: error.stack });
            res.status(500).json({
                success: false,
                message: "Internal server error while calculating fare",
            });
        }
    };
}
