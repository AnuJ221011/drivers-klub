import "dotenv/config";
import app from "./app.js";
import { logger } from "./utils/logger.js";
import http from "http";
import { connectDB } from "./utils/prisma.js";
import { startStatusSyncWorker } from "./worker.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const startServer = async () => {
    await connectDB();
    startStatusSyncWorker();

    server.listen(PORT, () => {
        logger.info(`🚀 Driver’s Klub backend running on port ${PORT}`);
        logger.info(`🩺 Health check available at /health`);
    });
};

startServer();


// Graceful shutdown
const shutdown = (signal: string) => {
    logger.warn(`🛑 Received ${signal}. Shutting down gracefully...`);

    server.close(() => {
        logger.info("✅ Server closed. Process exiting.");
        process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
        logger.error("❌ Forced shutdown due to timeout");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Unexpected errors
process.on("uncaughtException", (err) => {
    logger.error("💥 Uncaught Exception", err);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    logger.error("💥 Unhandled Rejection", reason);
    process.exit(1);
});
