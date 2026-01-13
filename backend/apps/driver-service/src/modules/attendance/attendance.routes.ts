import { Router } from "express";
import { AttendanceController } from "./attendance.controller.js";
import { authenticate, authorizeRoles } from "@driversklub/common";

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
  authorizeRoles('SUPER_ADMIN', 'OPERATIONS', 'MANAGER'),
  controller.getById
);

router.post(
  "/:id/approve",
  authorizeRoles('SUPER_ADMIN', 'MANAGER'),
  controller.approve
);

router.post(
  "/:id/reject",
  authorizeRoles('SUPER_ADMIN', 'MANAGER'),
  controller.reject
);

export default router;