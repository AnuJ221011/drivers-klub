import express, { type Request, type Response } from "express";
import cors from "cors";
import { errorHandler, notFound, requestLogger } from "@driversklub/common";
import assignmentRoutes from "./modules/assignments/assignment.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "assignment-service" });
});
app.get("/", (_req: Request, res: Response) => {
    res.status(200).send("Assignment Service is running");
});

// Routes
app.use("/assignments", assignmentRoutes);

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
