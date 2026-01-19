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

            let distanceKm = clientDistanceKm;
            let distanceSource: "GOOGLE_MAPS" | "CLIENT_PROVIDED" = "CLIENT_PROVIDED";

            // Try to get distance from Google Maps if pickup and drop are provided
            if (pickup && drop) {
                logger.info("Attempting Google Maps distance calculation", { pickup, drop });

                const googleResult = await this.googleMaps.getDistance(pickup, drop);

                if (googleResult) {
                    distanceKm = googleResult.distanceKm;
                    distanceSource = "GOOGLE_MAPS";
                    logger.info("Using Google Maps distance", {
                        distanceKm,
                        durationMins: googleResult.durationMins
                    });
                } else {
                    logger.warn("Google Maps returned null, falling back to client distance", {
                        clientDistanceKm,
                    });

                    if (!clientDistanceKm) {
                        res.status(400).json({
                            success: false,
                            message: "Google Maps unavailable and no distanceKm provided. Please provide distanceKm as fallback.",
                        });
                        return;
                    }
                }
            } else {
                // No pickup/drop provided, must have client distance
                if (!clientDistanceKm) {
                    res.status(400).json({
                        success: false,
                        message: "Either provide (pickup + drop) or distanceKm",
                    });
                    return;
                }
                logger.info("Using client-provided distance (no pickup/drop locations)", {
                    distanceKm: clientDistanceKm,
                });
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
