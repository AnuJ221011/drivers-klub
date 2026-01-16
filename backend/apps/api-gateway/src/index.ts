import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

import path from "path";
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['*'];

app.use(cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "api-gateway" });
});

// Root health check for AWS/Render LB
app.get("/", (req, res) => {
    res.status(200).send("Drivers Klub API Gateway is running");
});

// Proxy Config
// On Windows, `localhost` can resolve to IPv6 (::1) and cause proxy timeouts when
// upstream services are listening on IPv4. Prefer explicit IPv4 loopback.
const LOCALHOST = process.env.SERVICE_HOST || "127.0.0.1";

const services = {
    auth: `http://${LOCALHOST}:3001`,
    driver: `http://${LOCALHOST}:3002`,
    vehicle: `http://${LOCALHOST}:3003`,
    assignment: `http://${LOCALHOST}:3004`,
    trip: `http://${LOCALHOST}:3005`,
    notification: `http://${LOCALHOST}:3006`
};

// Routes Mapping
app.use("/auth", createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    pathRewrite: {
        "^/auth/health": "/health"
    }
}));
app.use("/users", createProxyMiddleware({ target: services.auth, changeOrigin: true })); // Auth service handles users too

app.use("/drivers", createProxyMiddleware({
    target: services.driver,
    changeOrigin: true,
    pathRewrite: {
        "^/drivers/health": "/health"
    }
}));
app.use("/attendance", createProxyMiddleware({ target: services.driver, changeOrigin: true }));
app.use("/vehicles", createProxyMiddleware({
    target: services.vehicle,
    changeOrigin: true,
    pathRewrite: {
        "^/vehicles/health": "/health"
    }
}));
app.use("/fleets", createProxyMiddleware({ target: services.vehicle, changeOrigin: true })); // Fleet routes in vehicle service
app.use("/fleet-managers", createProxyMiddleware({ target: services.vehicle, changeOrigin: true })); // Fleet Manager routes
app.use("/assignments", createProxyMiddleware({
    target: services.assignment,
    changeOrigin: true,
    pathRewrite: {
        "^/assignments/health": "/health"
    }
}));
app.use("/trips", createProxyMiddleware({
    target: services.trip,
    changeOrigin: true,
    pathRewrite: {
        "^/trips/health": "/health"
    }
}));

app.use("/admin/trips", createProxyMiddleware({
    target: services.trip,
    changeOrigin: true
}));
app.use("/notifications", createProxyMiddleware({
    target: services.notification,
    changeOrigin: true,
    pathRewrite: {
        "^/notifications/health": "/health"
    }
}));

app.use("/partners", createProxyMiddleware({
    target: services.trip,
    changeOrigin: true,
    pathRewrite: {
        "^/partners/health": "/health"
    }
}));

app.use("/payments", createProxyMiddleware({ target: services.trip, changeOrigin: true }));
app.use("/pricing", createProxyMiddleware({ target: services.trip, changeOrigin: true }));
app.use("/webhooks", createProxyMiddleware({ target: services.trip, changeOrigin: true }));

// Admin routes for payments/pricing needed?
// payment.routes.ts has /admin/rental-plans etc inside it.
// If mapped to /payments, then /payments/admin/rental-plans works.
// BUT legalacy frontend likely calls /admin/rental-plans directly. 
// We need to proxy /admin/rental-plans, /admin/penalty etc to trip service.

app.use("/admin/rental-plans", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/admin/rental-plans": "/payments/admin/rental-plans" } }));
app.use("/admin/penalty", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/admin/penalty": "/payments/admin/penalty" } }));
app.use("/admin/incentive", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/admin/incentive": "/payments/admin/incentive" } }));
app.use("/admin/collection", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/admin/collection": "/payments/admin/collection" } }));
app.use("/admin/reconciliations", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/admin/reconciliations": "/payments/admin/reconciliations" } }));
app.use("/admin/payouts", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/admin/payouts": "/payments/admin/payouts" } }));
app.use("/admin/bulk-payout", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/admin/bulk-payout": "/payments/admin/bulk-payout" } }));
app.use("/admin/vehicle", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/admin/vehicle": "/payments/admin/vehicle" } })); // for QR
app.use("/orders", createProxyMiddleware({ target: services.trip, changeOrigin: true, pathRewrite: { "^/orders": "/payments/orders" } }));

// Handle typo: /payment -> /payments (frontend might have typo)
// This must be AFTER specific /admin/vehicle route to avoid conflicts
app.use("/payment", createProxyMiddleware({
    target: services.trip,
    changeOrigin: true,
    pathRewrite: { "^/payment": "/payments" },
    logLevel: 'debug'
}));

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
