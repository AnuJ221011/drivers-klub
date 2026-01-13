import express from "express";
import cors from "cors";
import { errorHandler, notFound, requestLogger } from "@driversklub/common";
import driverRoutes from "./modules/drivers/driver.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "driver-service" });
});
app.get("/", (req, res) => {
    res.status(200).send("Driver Service is running");
});

// Routes
app.use("/drivers", driverRoutes);
app.use("/attendance", attendanceRoutes);

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
