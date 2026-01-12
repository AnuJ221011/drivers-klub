
import { Request, Response, NextFunction } from "express";
import { RapidoService } from "./rapido.service.js";
import { ApiError } from "../../../utils/apiError.js";

const rapidoService = new RapidoService();

export class RapidoController {

    async onOrderStatusUpdate(req: Request, res: Response, next: NextFunction) {
        try {
            // Check path param vs body param overlap?
            // example: /on_order_status/1234567890
            // body: { orderId: "RD123456" ... }
            // "1234567890" vs "RD123456" might be different (Ride vs Rapido ID).
            // We'll trust the body payload for data.

            await rapidoService.handleOrderStatusUpdate(req.body);
            res.status(200).json({ status: "success", message: "Order status updated" });
        } catch (error) {
            next(error);
        }
    }

    async onCaptainStatusUpdate(req: Request, res: Response, next: NextFunction) {
        try {
            // Example: /on_captain_status/1234567890
            await rapidoService.handleCaptainStatusCallback(req.body);
            res.status(200).json({ status: "success", message: "Captain status updated" });
        } catch (error) {
            next(error);
        }
    }

    // Internal API to trigger status change
    async changeCaptainStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { driverId, status, vehicleNo } = req.body;
            if (!driverId || !status) {
                throw new ApiError(400, "driverId and status are required");
            }
            if (status !== 'online' && status !== 'offline') {
                throw new ApiError(400, "Status must be 'online' or 'offline'");
            }

            const result = await rapidoService.changeCaptainStatusRequest(driverId, status, vehicleNo);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
