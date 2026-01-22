import { Router, Request, Response, NextFunction } from "express";
import { MMTController } from "./mmt.controller.js";
import { basicAuth, ApiError } from "@driversklub/common";


const router = Router();
const controller = new MMTController();

// Inbound APIs (MMT -> Us)
router.post("/partnersearchendpoint", basicAuth, controller.search);
router.post("/partnerblockendpoint", basicAuth, controller.block);
router.post("/partnerpaidendpoint", basicAuth, controller.paid);
router.post("/partnercancelendpoint", basicAuth, controller.cancel);
router.post("/partnerrescheduleblockendpoint", basicAuth, controller.rescheduleBlock);
router.post("/partnerrescheduleconfirmendpoint", basicAuth, controller.rescheduleConfirm);

// Booking Details (Query Params based)
router.get("/booking/details", basicAuth, controller.getBookingDetails);

// Custom MMT Error Handler - returns errors in MMT-expected format
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err.message || "Internal Server Error";
    
    // Return error in MMT format
    res.status(statusCode).json({
        response: {
            success: false,
            status: "FAILURE",
            error_code: statusCode === 404 ? "NOT_FOUND" : statusCode === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR",
            error_message: message
        },
        error: message,
        code: statusCode.toString()
    });
});

export default router;
