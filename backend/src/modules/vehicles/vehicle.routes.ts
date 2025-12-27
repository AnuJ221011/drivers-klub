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

const router = Router();

router.use(authenticate);

router.post("/", authorizeRoles("SUPER_ADMIN", "OPERATIONS"), createVehicle);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getVehiclesByFleet
);

router.get(
  "/hub/:hubId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getVehiclesByHub
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getVehicleById
);

router.patch(
  "/:id/docs",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  updateVehicleDocs
);

router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  updateVehicle
);

router.patch(
  "/:id/status",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  updateVehicleStatus
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  deactivateVehicle
);

export default router;