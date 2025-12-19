import { Router } from "express";
import {
  createFleet,
  getAllFleets,
  getFleetById,
  deactivateFleet
} from "./fleet.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN"),
  createFleet
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  getAllFleets
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  getFleetById
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN"),
  deactivateFleet
);

export default router;
