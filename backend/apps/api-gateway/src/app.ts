import express from "express";
import { configureSecurity, configureLogging } from "./middleware/setup.js";
import routes from "./routes/index.js";

const app = express();

// 1. Setup Middleware
configureSecurity(app);
configureLogging(app);

// 2. Health Checks
app.get("/health", (_req, res) => res.json({ status: "ok", service: "api-gateway" }));
app.get("/", (_req, res) => res.status(200).send("Drivers Klub API Gateway is running"));

// 3. Mount Routes
app.use(routes);

// 4. 404 Handler (Pass to standard error handler or return 404)
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});

export default app;
