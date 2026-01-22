import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

import app from "./app";
import { logger } from "@driversklub/common";
import { createServer } from "http";
import { Server } from "socket.io";
import { SqsConsumer } from "./modules/notifications/sqs.consumer";

const PORT = process.env.NOTIFICATION_PORT || 3006;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Configure as needed
    methods: ["GET", "POST"],
  },
});

// Basic Socket.io setup
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize and start SQS consumer for OTP messages
const sqsConsumer = new SqsConsumer();

httpServer.listen(PORT, async () => {
  logger.info(`Notification Service running on port ${PORT}`);

  // Start SQS consumer after server is ready
  try {
    await sqsConsumer.start();
    logger.info("SQS consumer started successfully");
  } catch (error: any) {
    logger.error("Failed to start SQS consumer", {
      error: error.message,
    });
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  sqsConsumer.stop();
  httpServer.close(() => {
    logger.info("Process terminated");
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  sqsConsumer.stop();
  httpServer.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});
