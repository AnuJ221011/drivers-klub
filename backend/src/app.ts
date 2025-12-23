import express, { Application } from "express";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import driverRoutes from "./modules/drivers/driver.routes.js";
import fleetRoutes from "./modules/fleet/fleet.routes.js";
import fleetManagerRoutes from "./modules/fleetManager/fleetManager.routes.js";
import vehicleRoutes from "./modules/vehicles/vehicle.routes.js";
import assignmentRoutes from "./modules/assignments/assignment.routes.js";
import tripRoutes from "./modules/trips/trip.routes.js";
import cors from "cors";





const app: Application = express();

// CORS (allow frontend dev server)
const allowedOrigins = new Set<string>([
    "http://localhost:5173"
]);

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // allow non-browser clients (Postman/curl) with no Origin header
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(
    cors(corsOptions)
);

// Preflight
// NOTE: Express/router in some versions doesn't accept "*" as a path.
app.options(/.*/, cors(corsOptions));

app.use(express.json());
// also accept urlencoded form data (useful for Postman x-www-form-urlencoded or HTML forms)
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// for health checks of the service
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "drivers-klub-backend",
        timestamp: new Date().toISOString()
    });
});

// for authentication
app.use("/auth", authRoutes);
// for users
app.use("/users", userRoutes);
// for drivers
app.use("/drivers", driverRoutes);
// for fleets
app.use("/fleets", fleetRoutes);
// for fleet managers
app.use("/fleet-managers", fleetManagerRoutes);
// for vehicles
app.use("/vehicles", vehicleRoutes);
// for assignments
app.use("/assignments", assignmentRoutes);
// for trips
app.use("/trips", tripRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
