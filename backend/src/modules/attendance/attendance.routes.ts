import { Router } from "express";
import { AttendanceController } from "./attendance.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRoles } from "../../middlewares/authorize.js";
import { UserRole } from "../../shared/enums/user-role.enum.js";

const router = Router();
const controller = new AttendanceController();

router.use(authenticate);

router.post("/check-in", controller.checkIn);
router.post("/check-out", controller.checkOut);
router.post("/start-break", controller.startBreak);
router.post("/end-break", controller.endBreak);
router.get("/history", controller.getHistory);
router.get(
    "/:id",
    authorizeRoles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.MANAGER),
    controller.getById
);

router.post(
  "/:id/approve",
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.MANAGER),
  controller.approve
);

router.post(
  "/:id/reject",
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.MANAGER),
  controller.reject
);

export default router;