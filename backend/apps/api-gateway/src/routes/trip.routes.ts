import { Router } from "express";
import { createProxy } from "../core/proxy.factory.js";
import { config } from "../config/env.js";

const router = Router();

// Core Trip Routes
router.use("/trips", createProxy(config.services.trip, {
    pathRewrite: { "^/trips/health": "/health" }
}));
router.use("/assignments", createProxy(config.services.assignment, {
    pathRewrite: { "^/assignments/health": "/health" }
}));

// Partners & MMT
router.use("/partners", createProxy(config.services.trip, {
    pathRewrite: { "^/partners/health": "/health" }
}));
router.use("/partner/mmt", createProxy(config.services.trip, {
    pathRewrite: { "^/partner/mmt": "/partners/mmt" }
}));

// Payments & Pricing
router.use("/payments", createProxy(config.services.trip));
router.use("/pricing", createProxy(config.services.trip));
router.use("/webhooks", createProxy(config.services.trip));
router.use("/maps", createProxy(config.services.trip));

// Specific Payment Redirects
router.use("/payment/success", createProxy(config.services.trip, {
    pathRewrite: { "^/payment/success": "/webhooks/payment/success" }
}));
router.use("/payment/failure", createProxy(config.services.trip, {
    pathRewrite: { "^/payment/failure": "/webhooks/payment/failure" }
}));
router.use("/payment", createProxy(config.services.trip, {
    pathRewrite: { "^/payment": "/payments" },
    logLevel: 'debug'
}));

// Admin Routes (Proxied to Payments/Trip Service)
router.use("/admin/trips", createProxy(config.services.trip));

const adminPaymentRoutes = [
    "rental-plans", "penalty", "incentive",
    "collection", "reconciliations", "payouts",
    "bulk-payout", "vehicle"
];

adminPaymentRoutes.forEach(route => {
    router.use(`/admin/${route}`, createProxy(config.services.trip, {
        pathRewrite: { [`^/admin/${route}`]: `/payments/admin/${route}` }
    }));
});

router.use("/orders", createProxy(config.services.trip, {
    pathRewrite: { "^/orders": "/payments/orders" }
}));

export default router;
