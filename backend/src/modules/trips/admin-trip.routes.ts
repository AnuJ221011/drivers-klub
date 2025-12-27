import { Router } from "express";
import { AdminTripController } from "./admin-trip.controller.js";
import { authorizeRoles } from "../../middlewares/authorize.js";
import { UserRole } from "../../shared/enums/user-role.enum.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();
const controller = new AdminTripController();

router.use(authenticate);

router.get(
  "/",
  authorizeRoles(UserRole.SUPER_ADMIN),
  controller.getAllTrips.bind(controller)
);

router.post(
  "/assign",
  authorizeRoles(UserRole.SUPER_ADMIN),
  controller.assignDriver.bind(controller)
);

router.post(
  "/unassign",
  authorizeRoles(UserRole.SUPER_ADMIN),
  controller.unassignDriver.bind(controller)
);

router.post(
  "/reassign",
  authorizeRoles(UserRole.SUPER_ADMIN),
  controller.reassignDriver.bind(controller)
);

export default router;