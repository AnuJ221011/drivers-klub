
import { Router } from "express";
import { RapidoController } from "./rapido.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";

const router = Router();
const controller = new RapidoController();

// Webhooks 
// Rapido sends webhooks here. No strict auth middleware yet (Rapido sends apiKey in header, validation to be added later)
router.put("/on_order_status/:orderId", (req, res, next) => controller.onOrderStatusUpdate(req, res, next));
router.put("/on_order_status", (req, res, next) => controller.onOrderStatusUpdate(req, res, next));

router.put("/on_captain_status/:id", (req, res, next) => controller.onCaptainStatusUpdate(req, res, next));
router.put("/on_captain_status", (req, res, next) => controller.onCaptainStatusUpdate(req, res, next));

// Internal API
// Used by our dashboard to change captain status on Rapido side
router.post("/change-status", authenticate, authorizeRoles('SUPER_ADMIN', 'OPERATIONS', 'MANAGER'), (req, res, next) => controller.changeCaptainStatus(req, res, next));

export default router;
