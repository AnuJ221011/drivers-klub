import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

import app from "./app";
import { logger } from "@driversklub/common";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.NOTIFICATION_PORT || 3006;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Configure as needed
        methods: ["GET", "POST"]
    }
});

// Basic Socket.io setup
io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    logger.info(`Notification Service running on port ${PORT}`);
});

process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    httpServer.close(() => {
        logger.info("Process terminated");
    });
});
