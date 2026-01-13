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
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  createFleetManager
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  getFleetManagersByFleet
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN"),
  deactivateFleetManager
);

export default router;
