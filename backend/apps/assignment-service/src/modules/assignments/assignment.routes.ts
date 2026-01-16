import { Router } from "express";
import {
  createAssignment,
  getAssignmentsByFleet,
  getAssignmentsByTrip,
  endAssignment
} from "./assignment.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";
import { hydrateUserScope } from "../../middlewares/hydrateUserScope.js";

const router = Router();

router.use(authenticate);
router.use(hydrateUserScope);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  createAssignment
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  getAssignmentsByFleet
);

router.get(
  "/trip/:tripId",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  getAssignmentsByTrip
);

router.patch(
  "/:id/end",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  endAssignment
);

export default router;