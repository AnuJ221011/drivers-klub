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

// SUPER_ADMIN only
router.post("/", authorizeRoles("SUPER_ADMIN"), createUser);
router.patch(
    "/:id/deactivate",
    authorizeRoles("SUPER_ADMIN"),
    deactivateUser
);

// SUPER_ADMIN + OPERATIONS
router.get(
    "/",
    authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
    getAllUsers
);

router.get(
    "/:id",
    authorizeRoles("SUPER_ADMIN", "OPERATIONS"),
    getUserById
);

export default router;
