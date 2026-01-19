import { Router } from "express";
import authRoutes from "./auth.routes.js";
import driverRoutes from "./driver.routes.js";
import vehicleRoutes from "./vehicle.routes.js";
import tripRoutes from "./trip.routes.js";
import miscRoutes from "./misc.routes.js";

const router = Router();

router.use(authRoutes);
router.use(driverRoutes);
router.use(vehicleRoutes);
router.use(tripRoutes);
router.use(miscRoutes);

export default router;
