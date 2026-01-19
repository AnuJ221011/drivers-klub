import express from "express";
import cors from "cors";
import { errorHandler, notFound, requestLogger /*, authenticate*/ } from "@driversklub/common";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "auth-service" });
});
app.get("/", (_req, res) => {
    res.status(200).send("Auth Service is running");
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
