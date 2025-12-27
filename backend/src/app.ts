import express, { Application } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { prisma } from "./utils/prisma.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import driverRoutes from "./modules/drivers/driver.routes.js";
import fleetRoutes from "./modules/fleet/fleet.routes.js";
import fleetManagerRoutes from "./modules/fleetManager/fleetManager.routes.js";
import vehicleRoutes from "./modules/vehicles/vehicle.routes.js";
import assignmentRoutes from "./modules/assignments/assignment.routes.js";
import tripRoutes from "./modules/trips/trip.routes.js";
import pricingRoutes from "./modules/pricing/pricing.routes.js";
import adminTripRoutes from "./modules/trips/admin-trip.routes.js";
import mmtRoutes from "./modules/partner/mmt/mmt.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";


const app: Application = express();

// Trust proxy - Required when running behind reverse proxy (Render, Heroku, etc.)
// This allows express-rate-limit to correctly identify client IPs
app.set('trust proxy', 1);

// CORS Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = isDevelopment
    ? '*'
    : (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000']);

app.use(cors({
    origin: allowedOrigins,
    credentials: !isDevelopment, // Only allow credentials in production with specific origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
// also accept urlencoded form data (useful for Postman x-www-form-urlencoded or HTML forms)
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get("/health", async (_req, res) => {
    try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: "ok",
            service: "drivers-klub-backend",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: "error",
            service: "drivers-klub-backend",
            database: "disconnected",
            timestamp: new Date().toISOString()
        });
    }
});

app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Welcome to Driver's Klub API 🚖",
        status: "active",
        documentation: "/api-docs (Coming Soon)",
        health_check: "/health"
    });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/drivers", driverRoutes);
app.use("/fleets", fleetRoutes);
app.use("/fleet-managers", fleetManagerRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/trips", tripRoutes);
app.use("/pricing", pricingRoutes);
app.use("/admin/trips", adminTripRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/partner/mmt", mmtRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
