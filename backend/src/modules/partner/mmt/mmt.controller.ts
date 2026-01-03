import { Request, Response, NextFunction } from "express";
import { MMTService } from "./mmt.service.js";
import { ApiResponse } from "../../../utils/apiResponse.js";

export class MMTController {
    private service = new MMTService();

    search = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.searchFare(req.body);
            ApiResponse.send(res, 200, result, "Fare search successful");
            // ... and so on for others
        } catch (error) {
            next(error);
        }
    };

    block = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.blockRide(req.body);
            ApiResponse.send(res, 200, result, "Ride blocked successfully");
        } catch (error) {
            next(error);
        }
    };

    paid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.confirmPaid(req.body);
            ApiResponse.send(res, 200, result, "Ride confirmed successful");
        } catch (error) {
            next(error);
        }
    };

    cancel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.cancelRide(req.body);
            ApiResponse.send(res, 200, result, "Ride cancelled successfully");
        } catch (error) {
            next(error);
        }
    };

    rescheduleBlock = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.rescheduleBlock(req.body);
            ApiResponse.send(res, 200, result, "Reschedule block successful");
        } catch (error) {
            next(error);
        }
    };

    rescheduleConfirm = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.rescheduleConfirm(req.body);
            ApiResponse.send(res, 200, result, "Reschedule confirm successful");
        } catch (error) {
            next(error);
        }
    };

    getBookingDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // "GET /booking/details?partner_reference_number=...&order_reference_number=..."
            const { partner_reference_number, order_reference_number } = req.query;

            // MMT usually sends one or the other. We prioritize our bookingId (partner_reference_number)
            const bookingId = (partner_reference_number as string) || (order_reference_number as string);

            if (!bookingId) {
                return ApiResponse.send(res, 400, null, "Missing partner_reference_number or order_reference_number");
            }

            const result = await this.service.getBookingDetails(bookingId);
            ApiResponse.send(res, 200, result, "Booking details retrieved");
        } catch (error) {
            next(error);
        }
    };
}
