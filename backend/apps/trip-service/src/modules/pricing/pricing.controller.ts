import { Request, Response } from "express";
import { MIN_BILLABLE_KM, PRICE_PER_KM } from "./pricing.config.js";
import { TripType } from "@prisma/client";
import { ApiResponse } from "@driversklub/common";
import { PricingEngine } from "./pricing.engine.js";

export class PricingController {
  async preview(req: Request, res: Response) {
    const body = req.body;

    // 1️⃣ Validate trip rules
    // ...

    // 2️⃣ Calculate fare
    const pricing = PricingEngine.calculateFare({
      distanceKm: body.distanceKm,
      tripType: body.tripType as TripType,
      pickupTime: new Date(body.tripDate),
      bookingTime: new Date(body.bookingDate),
      vehicleType: "EV",
    });

    const billableDistance = Math.max(
      MIN_BILLABLE_KM,
      Math.ceil(body.distanceKm)
    );

    const responseData = {
      billableDistanceKm: billableDistance,
      ratePerKm: PRICE_PER_KM,
      baseFare: pricing.baseFare,
      totalFare: pricing.finalFare,
      breakdown: pricing.breakdown,
      currency: "INR",
    };

    return ApiResponse.send(res, 200, responseData, "Fare calculated successfully");
  }
}
