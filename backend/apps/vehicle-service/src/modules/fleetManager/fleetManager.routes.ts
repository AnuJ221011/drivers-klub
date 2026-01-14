import { Router } from "express";
import {
  createFleetManager,
  getFleetManagersByFleet,
  deactivateFleetManager
} from "./fleetManager.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "MANAGER"),
  createFleetManager
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "MANAGER"),
  getFleetManagersByFleet
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "MANAGER"),
  deactivateFleetManager
);

export default router;
