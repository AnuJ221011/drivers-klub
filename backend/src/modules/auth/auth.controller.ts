import type { Request, Response } from "express";
import { OtpService } from "./otp/otp.service.js";
import {
    issueTokens,
    refresh as refreshTokenService,
    revokeAllUserTokens,
    revokeRefreshToken
} from "./token.service.js";
import { prisma } from "../../utils/prisma.js";
import { verifyAccessToken, verifyRefreshToken } from "./jwt.util.js";

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

export const logout = async (req: Request, res: Response) => {
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };

    // 1) Best-effort revoke provided refresh token (even if expired/invalid JWT)
    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
        // If refresh token is still a valid JWT, also revoke all tokens for that user
        try {
            const payload = verifyRefreshToken(refreshToken);
            await revokeAllUserTokens(payload.sub);
        } catch {
            // ignore invalid/expired refresh token JWT
        }
    }

    // 2) If access token is present and valid, revoke all tokens for that user as well
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const payload = verifyAccessToken(token);
            await revokeAllUserTokens(payload.sub);
        } catch {
            // ignore invalid/expired access token
        }
    }

    res.json({ message: "Logged out" });
};