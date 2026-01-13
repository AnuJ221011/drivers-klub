import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

import app from "./app";
import { logger } from "@driversklub/common";

const PORT = process.env.VEHICLE_PORT || 3003;

const server = app.listen(PORT, () => {
    logger.info(`Vehicle Service running on port ${PORT}`);
});

process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
        logger.info("Process terminated");
    });
});
