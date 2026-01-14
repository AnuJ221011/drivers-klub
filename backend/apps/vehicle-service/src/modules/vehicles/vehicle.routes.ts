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
import { authenticate, authorizeRoles } from "@driversklub/common";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"), createVehicle);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  getVehiclesByFleet
);

router.get(
  "/hub/:hubId",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  getVehiclesByHub
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  getVehicleById
);

router.patch(
  "/:id/docs",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  updateVehicleDocs
);

router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  updateVehicle
);

router.patch(
  "/:id/status",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  updateVehicleStatus
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  deactivateVehicle
);

export default router;