
import { Router } from "express";
import { AttendanceController } from "./attendance.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";
import { UserRole } from "../../shared/enums/user-role.enum.js";

const router = Router();
const controller = new AttendanceController();

router.use(authenticate);

// Driver Actions
router.post("/check-in", controller.checkIn);
router.post("/check-out", controller.checkOut);
router.get("/history", controller.getHistory); // Driver can see own history? Current implementation allows filtering by driverId.

// Admin Actions
router.post(
    "/:id/approve",
    authorizeRoles(UserRole.SUPER_ADMIN, UserRole.MANAGER), // Assuming Fleet Manager can also approve
    controller.approve
);

router.post(
    "/:id/reject",
    authorizeRoles(UserRole.SUPER_ADMIN, UserRole.MANAGER),
    controller.reject
);

export default router;
