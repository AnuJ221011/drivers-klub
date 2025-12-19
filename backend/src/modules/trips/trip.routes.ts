import { Router } from "express";
import {
  createTrip,
  startTrip,
  completeTrip,
  getTripsByFleet,
  getMyTrips
} from "./trip.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN","OPERATIONS", "MANAGER"),
  createTrip
);

router.patch(
  "/:id/start",
  authorizeRoles("DRIVER"),
  startTrip
);

router.patch(
  "/:id/complete",
  authorizeRoles("DRIVER"),
  completeTrip
);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  getTripsByFleet
);

router.get(
  "/me",
  authorizeRoles("DRIVER"),
  getMyTrips
);

export default router;
