import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

import app from "./app";
import { logger } from "@driversklub/common";
import { workerService } from "./services/worker.service.js";

const PORT = process.env.TRIP_PORT || 3005;

const server = app.listen(PORT, () => {
    logger.info(`Trip Service running on port ${PORT}`);

    // Start background worker
    workerService.start();
});

process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");

    // Stop worker first
    workerService.stop();

    server.close(() => {
        logger.info("Process terminated");
    });
});
