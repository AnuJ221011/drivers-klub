import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

import app from "./app";
import { logger } from "@driversklub/common";
import { connectDB } from "@driversklub/database";

const PORT = process.env.AUTH_PORT || 3001;

const startServer = async () => {
    try {
        await connectDB();
        const server = app.listen(PORT, () => {
            logger.info(`Auth Service running on port ${PORT}`);
        });

        process.on("SIGTERM", () => {
            logger.info("SIGTERM received, shutting down gracefully");
            server.close(() => {
                logger.info("Process terminated");
            });
        });
    } catch (error) {
        logger.error("Failed to start Auth Service:", error);
        process.exit(1);
    }
};

startServer();
