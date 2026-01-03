import { Router } from "express";
import { MMTController } from "./mmt.controller.js";

const router = Router();
const controller = new MMTController();

// Inbound APIs (MMT -> Us)
router.post("/partnersearchendpoint", controller.search);
router.post("/partnerblockendpoint", controller.block);
router.post("/partnerpaidendpoint", controller.paid);
router.post("/partnercancelendpoint", controller.cancel);
// router.post("/partnerrescheduleendpoint", controller.reschedule); // REMOVED as per spec
router.post("/partnerrescheduleblockendpoint", controller.rescheduleBlock);
router.post("/partnerrescheduleconfirmendpoint", controller.rescheduleConfirm);

// Booking Details (Query Params based)
router.get("/booking/details", controller.getBookingDetails);

export default router;
