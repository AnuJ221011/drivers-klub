import { Router } from "express";
import { AdminTripController } from "./admin-trip.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";
import { UserRole } from "../../shared/enums/user-role.enum.js";
import { hydrateUserScope } from "../../middlewares/hydrateUserScope.js";

const router = Router();
const controller = new AdminTripController();

router.use(authenticate);
router.use(hydrateUserScope);

router.get(
  "/",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_ADMIN,
    UserRole.OPERATIONS,
    UserRole.MANAGER
  ),
  controller.getAllTrips.bind(controller)
);

router.post(
  "/assign",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_ADMIN,
    UserRole.OPERATIONS,
    UserRole.MANAGER
  ),
  controller.assignDriver.bind(controller)
);

router.post(
  "/unassign",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_ADMIN,
    UserRole.OPERATIONS,
    UserRole.MANAGER
  ),
  controller.unassignDriver.bind(controller)
);

router.post(
  "/reassign",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_ADMIN,
    UserRole.OPERATIONS,
    UserRole.MANAGER
  ),
  controller.reassignDriver.bind(controller)
);

router.post(
  "/detach",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_ADMIN,
    UserRole.OPERATIONS,
    UserRole.MANAGER
  ),
  controller.detachDriver.bind(controller)
);

export default router;