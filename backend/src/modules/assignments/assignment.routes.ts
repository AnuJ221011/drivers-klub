import { Router } from "express";
import {
  createAssignment,
  getAssignmentsByFleet,
  getAssignmentsByTrip,
  getAssignmentById,
  endAssignment
} from "./assignment.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  createAssignment
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getAssignmentsByFleet
);

router.get(
  "/trip/:tripId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getAssignmentsByTrip
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getAssignmentById
);

router.patch(
  "/:id/end",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  endAssignment
);

export default router;