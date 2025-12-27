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

router.post(
  "/:id/hubs",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  createFleetHub
);

router.get(
  "/:id/hubs",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  getAllFleetHubs
);

router.post(
  "/:id/hub-managers",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  createHubManager
);

router.get(
  "/:id/hub-managers",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  getAllHubManagers
);

router.get(
  "/hub-manager/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  getHubManagerById
);

router.get(
  "/hubs/:id",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  getFleetHubById
);

router.post(
  "/hubs/:hubId/assign-manager",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  assignHubManager
);

router.post(
  "/hubs/:id/add-vehicle",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  addVehicleToHub
);

router.post(
  "/hubs/:id/add-driver",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  addDriverToHub
);

router.post(
  "/hubs/:id/remove-vehicle",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  removeVehicleFromHub
);

router.post(
  "/hubs/:id/remove-driver",
  authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
  removeDriverFromHub
);

export default router;
