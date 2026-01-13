import { Router } from "express";
import {
  createVehicle,
  getVehiclesByFleet,
  getVehicleById,
  updateVehicleDocs,
  deactivateVehicle,
  updateVehicle,
  updateVehicleStatus,
  getVehiclesByHub
} from "./vehicle.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";
import { enforceFleetScopeFromBody, enforceFleetScopeFromParam, enforceHubAccessFromParam, enforceVehicleAccessFromParam } from "../../middlewares/scope.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromBody("fleetId"),
  createVehicle
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromParam("fleetId"),
  getVehiclesByFleet
);

router.get(
  "/hub/:hubId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceHubAccessFromParam("hubId"),
  getVehiclesByHub
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceVehicleAccessFromParam("id"),
  getVehicleById
);

router.patch(
  "/:id/docs",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  enforceVehicleAccessFromParam("id"),
  updateVehicleDocs
);

router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceVehicleAccessFromParam("id"),
  updateVehicle
);

router.patch(
  "/:id/status",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceVehicleAccessFromParam("id"),
  updateVehicleStatus
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  enforceVehicleAccessFromParam("id"),
  deactivateVehicle
);

export default router;