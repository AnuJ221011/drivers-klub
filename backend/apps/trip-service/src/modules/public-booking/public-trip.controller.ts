import { Request, Response } from "express";
import { TripOrchestrator } from "../../core/trip/orchestrator/trip.orchestrator.js";
import { PricingEngine } from "../pricing/pricing.engine.js";
import { GoogleMapsAdapter } from "../../adapters/providers/google/google.adapter.js";
import { PublicTripPricingRequest, PublicTripPricingResponse, PublicCreateTripRequest, PublicCreateTripResponse } from "./public-trip.dto.js";
import { PricingInput } from "../pricing/pricing.types.js";
import { TripType } from "@prisma/client";
import { ApiResponse, logger } from "@driversklub/common";
import { prisma } from "@driversklub/database";

import { ConstraintEngine } from "../../core/constraints/constraint.engine.js";

export class PublicTripController {
  private googleMaps: GoogleMapsAdapter;

  constructor(private orchestrator: TripOrchestrator) {
    this.googleMaps = new GoogleMapsAdapter();
  }

  /**
   * Get pricing for a trip before confirmation
   */
  async getPricing(req: Request, res: Response): Promise<void> {
    try {
      const body: PublicTripPricingRequest = req.body;

      // Validate required fields
      if (!body.pickupLocation || !body.dropLocation) {
        res.status(400).json({
          success: false,
          message: "pickupLocation and dropLocation are required",
        });
        return;
      }

      if (!body.tripDate || !body.tripTime) {
        res.status(400).json({
          success: false,
          message: "tripDate and tripTime are required",
        });
        return;
      }

      if (!body.tripType) {
        res.status(400).json({
          success: false,
          message: "tripType is required",
        });
        return;
      }

      // Combine date and time into a single datetime
      const tripDateTime = this.combineDateAndTime(body.tripDate, body.tripTime);
      const bookingTime = new Date(); // Current time

      // Calculate distance
      let distanceKm;
        const googleResult = await this.googleMaps.getDistance(
          body.pickupLocation,
          body.dropLocation
        );

        if (googleResult) {
          distanceKm = googleResult.distanceKm;
          logger.info("Using Google Maps distance", { distanceKm });
        } else {
          res.status(400).json({
            success: false,
            message: "Unable to calculate distance. Please provide distanceKm.",
          });
          return;
        }

    const originCityResult = await this.googleMaps.getCityFromAddress(body.pickupLocation);

    // Apply constraint engine rules (T-1 booking, distance limits, etc.)
    const constraintResult = ConstraintEngine.validate({
      tripType: body.tripType as TripType,
      pickupTime: tripDateTime,
      distanceKm: distanceKm,
      vehicleType: "EV",
      isPrebook: true,
      originCity: originCityResult|| body.pickupLocation
    });

    if (!constraintResult.allowed) {
      throw new Error(constraintResult.reason);
    }

      // Determine vehicle type
      const vehicleType = "EV";

      // Prepare pricing input
      const pricingInput: PricingInput = {
        distanceKm,
        tripType: body.tripType as TripType,
        pickupTime: tripDateTime,
        bookingTime,
        vehicleType: vehicleType as "EV" | "NON_EV",
      };

      // Calculate fare
      const pricing = PricingEngine.calculateFare(pricingInput);

      const response: PublicTripPricingResponse = {
        success: true,
        data: {
          vehicleSku: "TATA_TIGOR_EV",
          vehicleType: "EV",
          tripType: body.tripType,
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
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error("[PublicTripController] Get Pricing Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while calculating fare",
        error: error.message,
      });
    }
  }

  /**
   * Create a trip by customer (public endpoint)
   */
  async createTrip(req: Request, res: Response): Promise<void> {
    try {
      const body: PublicCreateTripRequest = req.body;

      // Validate required fields
      if (!body.pickupLocation || !body.dropLocation) {
        res.status(400).json({
          success: false,
          message: "pickupLocation and dropLocation are required",
        });
        return;
      }

      if (!body.tripDate || !body.tripTime) {
        res.status(400).json({
          success: false,
          message: "tripDate and tripTime are required",
        });
        return;
      }

      if (!body.tripType) {
        res.status(400).json({
          success: false,
          message: "tripType is required",
        });
        return;
      }

      if (!body.customerName || !body.customerPhone) {
        res.status(400).json({
          success: false,
          message: "customerName and customerPhone are required",
        });
        return;
      }

      // Combine date and time into a single datetime
      const tripDateTime = this.combineDateAndTime(body.tripDate, body.tripTime);
      const bookingTime = new Date();

      // Calculate distance
      let distanceKm;
        const googleResult = await this.googleMaps.getDistance(
          body.pickupLocation,
          body.dropLocation
        );

        if (googleResult) {
          distanceKm = googleResult.distanceKm;
          logger.info("Using Google Maps distance", { distanceKm });
        } else {
          res.status(400).json({
            success: false,
            message: "Unable to calculate distance. Please provide distanceKm.",
          });
          return;
        }

      // Extract city from pickup and drop locations using Google Maps API
      const originCityResult = await this.googleMaps.getCityFromAddress(body.pickupLocation);
      const destinationCityResult = await this.googleMaps.getCityFromAddress(body.dropLocation);
      
      const originCity = originCityResult;
      const destinationCity = destinationCityResult;
      
      const originCoordinates = await this.googleMaps.getGeocode(body.pickupLocation);
      const destinationCoordinates = await this.googleMaps.getGeocode(body.dropLocation);

      // Determine vehicle type and SKU
      const vehicleType = "EV";
      const vehicleSku = "TATA_TIGOR_EV";

      // Prepare trip creation input
      const tripInput = {
        distanceKm,
        bookingDate: bookingTime.toISOString(),
        tripDate: tripDateTime.toISOString(),
        originCity,
        destinationCity,
        pickupLocation: body.pickupLocation,
        dropLocation: body.dropLocation,
        tripType: body.tripType,
        vehicleSku,
        pickupLat: originCoordinates?.lat,
        pickupLng: originCoordinates?.lng,
        dropLat: destinationCoordinates?.lat,
        dropLng: destinationCoordinates?.lng
      };

      // Create trip using orchestrator
      const ride = await this.orchestrator.createTrip(tripInput);

      // Store customer information in providerMeta
      if (ride) {
        await prisma.ride.update({
          where: { id: ride.id },
          data: {
            providerMeta: {
              customerName: body.customerName,
              customerPhone: body.customerPhone,
              isPublicBooking: true,
            },
          },
        });
      }

      const response: PublicCreateTripResponse = {
        success: true,
        data: {
          tripId: ride.id,
          status: ride.status,
          vehicleSku: vehicleSku,
          vehilceType: vehicleType,
          tripType: body.tripType,
          price: ride.price || 0,
          pickupLocation: ride.pickupLocation || body.pickupLocation,
          dropLocation: ride.dropLocation || body.dropLocation,
          tripDate: ride.pickupTime.toISOString(),
          customerName: body.customerName,
          customerPhone: body.customerPhone,
        },
        message: "Trip created successfully",
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error("[PublicTripController] Create Trip Error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to create trip",
      });
    }
  }

  /**
   * Helper to combine date and time strings into a Date object
   */
  private combineDateAndTime(dateStr: string, timeStr: string): Date {
    // If timeStr is already a full ISO datetime, parse it directly
    if (timeStr.includes("T") || timeStr.includes(" ")) {
      return new Date(timeStr);
    }

    // Otherwise, combine date and time
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(":").map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error("Invalid time format. Expected HH:mm");
    }

    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}

