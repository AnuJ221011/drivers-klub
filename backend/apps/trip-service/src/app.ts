import express from "express";
import cors from "cors";
import { errorHandler, notFound, requestLogger } from "@driversklub/common";
import tripRoutes from "./modules/trips/trip.routes.js";
import publicTripRoutes from "./modules/public-booking/public-trip.routes.js";
import rapidoRoutes from "./modules/partner/rapido/rapido.routes.js";
import mmtRoutes from "./modules/partner/mmt/mmt.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import pricingRoutes from "./modules/pricing/pricing.routes.js";
import mapsRoutes from "./modules/maps/maps.routes.js";
import webhookRoutes from "./modules/webhooks/webhook.routes.js";
import adminTripRoutes from "./modules/trips/admin-trip.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "trip-service" });
});
app.get("/", (_req, res) => {
    res.status(200).send("Trip Service is running");
});

// Routes
app.use("/maps", mapsRoutes);
app.use("/trips", tripRoutes);
app.use("/public/trips", publicTripRoutes); // Public trip booking endpoints
app.use("/partners/rapido", rapidoRoutes);
app.use("/partners/mmt", mmtRoutes);
app.use("/payments", paymentRoutes);
app.use("/pricing", pricingRoutes);
// app.use("/maps", mapsRoutes); // Moved to top
app.use("/webhooks", webhookRoutes);
app.use("/admin/trips", adminTripRoutes);

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
