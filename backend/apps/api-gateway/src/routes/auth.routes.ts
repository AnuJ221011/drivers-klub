import { Router } from "express";
import { createProxy } from "../core/proxy.factory.js";
import { config } from "../config/env.js";

const router = Router();

router.use("/auth", createProxy(config.services.auth, {
    pathRewrite: { "^/auth/health": "/health" }
}));

router.use("/users", createProxy(config.services.auth));

export default router;
