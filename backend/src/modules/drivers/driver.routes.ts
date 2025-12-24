import { Router } from "express";
import {
  createDriver,
  getDriversByFleet,
  getDriverById,
  updateDriver,
  updateDriverAvailability,
  updateDriverStatus
} from "./driver.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  createDriver
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getDriversByFleet
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getDriverById
);

router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  updateDriver
);

router.patch(
  "/:id/status",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  updateDriverStatus
);

router.patch(
  "/:id/availability",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  updateDriverAvailability
);

export default router;