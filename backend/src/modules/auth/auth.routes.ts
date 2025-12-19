import { Router } from "express";
import { sendOtp, verifyOtp, refresh } from "./auth.controller.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refresh);

export default router;
