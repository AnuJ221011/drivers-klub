import { Router } from "express";
import {
  createAssignment,
  getAssignmentsByFleet,
  getAssignmentsByTrip,
  endAssignment
} from "./assignment.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";
import { enforceFleetScopeFromBody, enforceFleetScopeFromParam } from "../../middlewares/scope.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromBody("fleetId"),
  createAssignment
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromParam("fleetId"),
  getAssignmentsByFleet
);

router.get(
  "/trip/:tripId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getAssignmentsByTrip
);

router.patch(
  "/:id/end",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  endAssignment
);

export default router;