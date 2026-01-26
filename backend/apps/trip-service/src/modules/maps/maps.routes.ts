import { Router } from "express";
import { MapsController } from "./maps.controller.js";
import { authorizeRoles, authenticate } from "@driversklub/common";

const router = Router();

// Secure maps endpoints - require authentication
// Allow DRIVER, OPS, MANAGER, SUPER_ADMIN to use maps features
router.use(authenticate);

router.get(
    "/autocomplete",
    authorizeRoles("DRIVER", "OPERATIONS", "MANAGER", "SUPER_ADMIN", "FLEET_ADMIN"),
    MapsController.getAutocomplete
);

router.get(
    "/geocode",
    authorizeRoles("DRIVER", "OPERATIONS", "MANAGER", "SUPER_ADMIN", "FLEET_ADMIN"),
    MapsController.getGeocode
);

export default router;
