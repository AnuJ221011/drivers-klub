import { Request, Response, NextFunction } from "express";
import { MMTService } from "./mmt.service.js";
import { ApiResponse } from "@driversklub/common";

export class MMTController {
    private service = new MMTService();

    search = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate request body exists
            if (!req.body || typeof req.body !== 'object') {
                return res.status(400).json({
                    response: {
                        status: 'FAILURE',
                        error_code: 'INVALID_REQUEST',
                        error_message: 'Request body is required'
                    }
                });
            }

            // Check for required field
            if (!req.body.start_time) {
                return res.status(400).json({
                    response: {
                        status: 'FAILURE',
                        error_code: 'MISSING_FIELD',
                        error_message: 'start_time is required'
                    }
                });
            }

            // Map MMT's field names to our internal field names
            const mappedInput = {
                pickupTime: req.body.start_time,
                tripType: req.body.trip_type_details?.basic_trip_type || "AIRPORT",
                distanceKm: req.body.one_way_distance || 40,
                pickupCity: req.body.source?.city || "DELHI",
                dropCity: req.body.destination?.city || "Unknown",
                // Pass through additional fields
                searchId: req.body.search_id,
                partnerName: req.body.partner_name,
                airportType: req.body.trip_type_details?.airport_type
            };

            const result = await this.service.searchFare(mappedInput);

            // MMT expects the root object to be { "response": { ... } }
            // Our service now returns exactly that structure (MMTSearchResponse).
            // So we send it directly as JSON, bypassing the standard ApiResponse wrapper
            // which would mistakenly wrap it in { "success": true, "data": ... }
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    block = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Map MMT's field names to our internal field names
            const mappedInput = {
                skuId: req.body.sku_id || req.body.skuId || "TATA_TIGOR_EV",
                mmtRefId: req.body.mmt_ref_id || req.body.order_reference_number || req.body.search_id,
                pickupTime: req.body.start_time || req.body.pickupTime,
                distanceKm: req.body.one_way_distance || req.body.distanceKm || 40,
                pickupCity: req.body.source?.city || req.body.pickupCity || "DELHI",
                dropCity: req.body.destination?.city || req.body.dropCity || "Unknown"
            };

            const result = await this.service.blockRide(mappedInput);
            // Same bypass for Block API
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    paid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.confirmPaid(req.body);
            // Same bypass for Paid API
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    cancel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.cancelRide(req.body);
            // Same bypass for Cancel API
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    rescheduleBlock = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.rescheduleBlock(req.body);
            // Same bypass for Reschedule Block API
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    rescheduleConfirm = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.rescheduleConfirm(req.body);
            // Same bypass for Reschedule Confirm API
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getBookingDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // GET /booking/details?booking_id=... OR ?partner_reference_number=...
            const { booking_id, partner_reference_number, order_reference_number } = req.query;

            // Determine which ID type and whether it's an external MMT reference
            let bookingId: string;
            let isExternalRef = false;

            if (booking_id) {
                bookingId = booking_id as string;
                isExternalRef = false; // Our internal booking ID
            } else if (partner_reference_number) {
                bookingId = partner_reference_number as string;
                isExternalRef = true; // MMT's external reference ID
            } else if (order_reference_number) {
                bookingId = order_reference_number as string;
                isExternalRef = false; // "order_reference_number" is OUR internal booking ID
            } else {
                return ApiResponse.send(res, 400, null, "Missing booking_id or partner_reference_number");
            }

            const result = await this.service.getBookingDetails(bookingId, isExternalRef);
            res.status(200).json(result); // Bypass ApiResponse wrapper to match MMT spec
        } catch (error) {
            next(error);
        }
    };
}
