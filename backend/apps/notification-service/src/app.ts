import express from "express";
import cors from "cors";
import { errorHandler, notFound, requestLogger } from "@driversklub/common";
import notificationRoutes from "./modules/notifications/notification.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "notification-service" });
});
app.get("/", (req, res) => {
    res.status(200).send("Notification Service is running");
});

// Routes
app.use("/notifications", notificationRoutes);

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
