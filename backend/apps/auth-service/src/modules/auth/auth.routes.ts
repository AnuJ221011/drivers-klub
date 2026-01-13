import { Router } from "express";
import { sendOtp, verifyOtp, refresh, logout } from "./auth.controller.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;