import { Router } from "express";
import {
  createDriver,
  getDriversByFleet,
  getMyProfile,
  getDriverById,
  updateDriver,
  updateDriverAvailability,
  updateDriverStatus,
  getDriversByHub,
  getDriverPreferences,
  createDriverPreferencesChangeRequest,
  getAllPreferenceChangePendingRequests,
  updatePreferenceChangeRequestStatus,
} from "./driver.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";
import { hydrateUserScope } from "../../middlewares/hydrateUserScope.js";

const router = Router();


router.use(authenticate);
router.use(hydrateUserScope);

router.post("/", authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"), createDriver);

router.get(
  "/fleet/:fleetId",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  getDriversByFleet
);

router.get(
  "/hub/:hubId",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  getDriversByHub
);

router.get("/me", authorizeRoles("DRIVER"), getMyProfile);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  getDriverById
);

router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  updateDriver
);

router.patch(
  "/:id/status",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  updateDriverStatus
);

router.patch(
  "/:id/availability",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "OPERATIONS", "MANAGER"),
  updateDriverAvailability
);

router.get("/:id/preference",
  authorizeRoles("SUPER_ADMIN", "DRIVER", "MANAGER", "FLEET_ADMIN", "OPERATIONS"),
  getDriverPreferences
);


router.post(
  "/:id/preference/update",
  authorizeRoles("SUPER_ADMIN", "DRIVER", "MANAGER", "FLEET_ADMIN"),
  createDriverPreferencesChangeRequest
);

router.get(
  "/preference/pending-requests",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  getAllPreferenceChangePendingRequests
);

router.post(
  "/preference/update-status",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  updatePreferenceChangeRequestStatus
);

export default router;
