import { Router } from "express";
import {
    createUser,
    getAllUsers,
    getUserById,
    deactivateUser
} from "./user.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";

const router = Router();

// All routes below require authentication
router.use(authenticate);

// Create team members:
// - SUPER_ADMIN: can create all roles
// - FLEET_ADMIN: can create MANAGER/OPERATIONS for their fleet (enforced in service)
// - MANAGER: can create OPERATIONS for their fleet (enforced in service)
router.post("/", authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "MANAGER"), createUser);
router.patch(
    "/:id/deactivate",
    authorizeRoles("SUPER_ADMIN"),
    deactivateUser
);

// SUPER_ADMIN + OPERATIONS
router.get(
    "/",
    authorizeRoles("SUPER_ADMIN", "OPERATIONS", "FLEET_ADMIN", "MANAGER"),
    getAllUsers
);

router.get(
    "/:id",
    authorizeRoles("SUPER_ADMIN", "OPERATIONS", "FLEET_ADMIN", "MANAGER"),
    getUserById
);

export default router;
