import { Router } from "express";
import { createProxy } from "../core/proxy.factory.js";
import { config } from "../config/env.js";

const router = Router();

router.use("/notifications", createProxy(config.services.notification, {
    pathRewrite: { "^/notifications/health": "/health" }
}));

export default router;
