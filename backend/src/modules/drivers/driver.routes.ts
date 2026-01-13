import { Router } from "express";
import {
  createDriver,
  getDriversByFleet,
  getMyProfile,
  getDriverById,
  updateDriver,
  updateDriverAvailability,
  updateDriverStatus,
  getDriversByHub
} from "./driver.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";
import { enforceDriverAccessFromParam, enforceFleetScopeFromBody, enforceFleetScopeFromParam, enforceHubAccessFromParam } from "../../middlewares/scope.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromBody("fleetId"),
  createDriver
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromParam("fleetId"),
  getDriversByFleet
);

router.get(
  "/hub/:hubId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceHubAccessFromParam("hubId"),
  getDriversByHub
);

router.get(
  "/me",
  authorizeRoles("DRIVER"),
  getMyProfile
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceDriverAccessFromParam("id"),
  getDriverById
);

router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceDriverAccessFromParam("id"),
  updateDriver
);

router.patch(
  "/:id/status",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceDriverAccessFromParam("id"),
  updateDriverStatus
);

router.patch(
  "/:id/availability",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceDriverAccessFromParam("id"),
  updateDriverAvailability
);

export default router;