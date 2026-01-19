import { Router } from "express";
import { createProxy } from "../core/proxy.factory.js";
import { config } from "../config/env.js";

const router = Router();

router.use("/vehicles", createProxy(config.services.vehicle, {
    pathRewrite: { "^/vehicles/health": "/health" }
}));

router.use("/fleets", createProxy(config.services.vehicle));
router.use("/fleet-managers", createProxy(config.services.vehicle));

export default router;
