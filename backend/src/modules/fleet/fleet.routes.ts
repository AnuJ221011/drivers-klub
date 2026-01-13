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
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";
import { enforceFleetScopeFromParam, enforceHubAccessFromParam } from "../../middlewares/scope.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN"),
  createFleet
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN"),
  getAllFleets
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromParam("id"),
  getFleetById
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN"),
  deactivateFleet
);

router.post(
  "/:id/hubs",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromParam("id"),
  createFleetHub
);

router.get(
  "/:id/hubs",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromParam("id"),
  getAllFleetHubs
);

router.post(
  "/:id/hub-managers",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromParam("id"),
  createHubManager
);

router.get(
  "/:id/hub-managers",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceFleetScopeFromParam("id"),
  getAllHubManagers
);

router.get(
  "/hub-manager/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  getHubManagerById
);

router.get(
  "/hubs/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceHubAccessFromParam("id"),
  getFleetHubById
);

router.post(
  "/hubs/:hubId/assign-manager",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  enforceHubAccessFromParam("hubId"),
  assignHubManager
);

router.post(
  "/hubs/:id/add-vehicle",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceHubAccessFromParam("id"),
  addVehicleToHub
);

router.post(
  "/hubs/:id/add-driver",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceHubAccessFromParam("id"),
  addDriverToHub
);

router.post(
  "/hubs/:id/remove-vehicle",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceHubAccessFromParam("id"),
  removeVehicleFromHub
);

router.post(
  "/hubs/:id/remove-driver",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER"),
  enforceHubAccessFromParam("id"),
  removeDriverFromHub
);

export default router;