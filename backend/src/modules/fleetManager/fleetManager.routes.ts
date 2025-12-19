import { Router } from "express";
import {
  createFleetManager,
  getFleetManagersByFleet,
  deactivateFleetManager
} from "./fleetManager.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";

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
