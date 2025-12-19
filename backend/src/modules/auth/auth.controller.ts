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
    const { phone, otp, verifiedKey } = req.body;

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
