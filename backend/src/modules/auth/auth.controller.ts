import type { Request, Response } from "express";
import { OtpService } from "./otp/otp.service.js";
import { issueTokens, refresh as refreshTokenService } from "./token.service.js";
import { prisma } from "../../utils/prisma.js";

const otpService = new OtpService();

export const sendOtp = async (req: Request, res: Response) => {
    const { phone } = req.body;

    // check if user exists before sending OTP if we strictly want only registered users
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
        return res.status(404).json({ message: "User not registered" });
    }

    await otpService.sendOtp(phone);
    res.json({ message: "OTP sent successfully" });
};

export const verifyOtp = async (req: Request, res: Response) => {
    console.log("Verifying OTP with request body:", req.body);
    const body = req.body;
    if (!body || typeof body !== "object") {
        console.warn("Invalid request body for verify-otp", body);
        return res.status(400).json({ message: "Invalid request body" });
    }

    const { phone, otp, verifiedKey } = body as {
        phone?: string;
        otp?: string;
        verifiedKey?: string;
    };

    if (!phone || !otp) {
        console.warn("Missing phone or otp in verify-otp request", { phone, otp });
        return res.status(400).json({ message: "phone and otp are required" });
    }

    await otpService.verifyOtp(phone, otp, verifiedKey);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
        return res.status(404).json({ message: "User not registered" });
    }

    const tokens = await issueTokens(user.id);
    res.json(tokens);
};

export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await refreshTokenService(refreshToken);
    res.json(tokens);
};
