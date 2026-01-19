import { Router } from "express";
import { MMTController } from "./mmt.controller.js";
import { basicAuth } from "@driversklub/common";


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

export default router;
