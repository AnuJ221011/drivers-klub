import { Router } from "express";
import {
  createUser,
  updateUser,
  getAllUsers,
  getUserById,
  deactivateUser,
} from "./user.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";

const router = Router();

// All routes below require authentication
router.use(authenticate);

// Create/update users
router.post("/", authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "MANAGER"), createUser);
router.patch("/:id", authorizeRoles("SUPER_ADMIN", "FLEET_ADMIN", "MANAGER"), updateUser);

// SUPER_ADMIN only
router.patch("/:id/deactivate", authorizeRoles("SUPER_ADMIN"), deactivateUser);

// SUPER_ADMIN + OPERATIONS + MANAGER + FLEET_ADMIN
router.get("/", authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"), getAllUsers);

router.get("/:id", authorizeRoles("SUPER_ADMIN", "OPERATIONS", "MANAGER", "FLEET_ADMIN"), getUserById);

export default router;
