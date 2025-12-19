import { Router } from "express";
import {
  createAssignment,
  getAssignmentsByFleet,
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

router.patch(
  "/:id/end",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  endAssignment
);

export default router;
