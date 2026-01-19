import { Router } from "express";
import { createProxy } from "../core/proxy.factory.js";
import { config } from "../config/env.js";

const router = Router();

router.use("/drivers", createProxy(config.services.driver, {
    pathRewrite: { "^/drivers/health": "/health" }
}));

router.use("/attendance", createProxy(config.services.driver));

export default router;
