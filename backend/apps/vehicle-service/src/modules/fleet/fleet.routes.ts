import { Router } from "express";
import {
  createFleet,
  getAllFleets,
  getFleetById,
  deactivateFleet,
  createFleetHub,
  getAllFleetHubs,
  getFleetHubById,
  createHubManager,
  getAllHubManagers,
  assignHubManager,
  addVehicleToHub,
  addDriverToHub,
  removeVehicleFromHub,
  removeDriverFromHub,
  getHubManagerById
} from "./fleet.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "MANAGER"),
  createFleet
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  getAllFleets
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  getFleetById
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN"),
  deactivateFleet
);

router.post(
  "/:id/hubs",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  createFleetHub
);

router.get(
  "/:id/hubs",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  getAllFleetHubs
);

router.post(
  "/:id/hub-managers",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  createHubManager
);

router.get(
  "/:id/hub-managers",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  getAllHubManagers
);

router.get(
  "/hub-manager/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  getHubManagerById
);

router.get(
  "/hubs/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  getFleetHubById
);

router.post(
  "/hubs/:hubId/assign-manager",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  assignHubManager
);

router.post(
  "/hubs/:id/add-vehicle",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  addVehicleToHub
);

router.post(
  "/hubs/:id/add-driver",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  addDriverToHub
);

router.post(
  "/hubs/:id/remove-vehicle",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  removeVehicleFromHub
);

router.post(
  "/hubs/:id/remove-driver",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"),
  removeDriverFromHub
);

export default router;