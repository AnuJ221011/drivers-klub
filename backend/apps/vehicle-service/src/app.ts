import express from "express";
import cors from "cors";
import { errorHandler, notFound, requestLogger } from "@driversklub/common";
import vehicleRoutes from "./modules/vehicles/vehicle.routes";
import fleetRoutes from "./modules/fleet/fleet.routes";
import fleetManagerRoutes from "./modules/fleetManager/fleetManager.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "vehicle-service" });
});
app.get("/", (_req, res) => {
    res.status(200).send("Vehicle Service is running");
});

// Routes
app.use("/vehicles", vehicleRoutes);
app.use("/fleets", fleetRoutes);
app.use("/fleet-managers", fleetManagerRoutes);

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
