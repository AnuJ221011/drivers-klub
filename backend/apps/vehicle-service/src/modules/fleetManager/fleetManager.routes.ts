import { Router } from "express";
import {
  createFleetManager,
  getFleetManagersByFleet,
  deactivateFleetManager
} from "./fleetManager.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";
import { hydrateUserScope } from "../../middlewares/hydrateUserScope.js";

const router = Router();

router.use(authenticate);
router.use(hydrateUserScope);

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
