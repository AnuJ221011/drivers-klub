import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate } from "@driversklub/common";

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.post("/send", controller.sendNotification);

export default router;
