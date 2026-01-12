import type { Request, Response } from "express";
import { OtpService } from "./otp/otp.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
    issueTokens,
    refresh as refreshTokenService,
    revokeAllUserTokens,
    revokeRefreshToken
} from "./token.service.js";
import { prisma } from "../../utils/prisma.js";
import { verifyAccessToken, verifyRefreshToken } from "./jwt.util.js";
import { logger } from "../../utils/logger.js";

const otpService = new OtpService();
import { RapidoService } from "../partner/rapido/rapido.service.js";
const rapidoService = new RapidoService();

export const sendOtp = async (req: Request, res: Response) => {
    const { phone } = req.body;

    // check if user exists before sending OTP if we strictly want only registered users
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
        return res.status(404).json({ message: "User not registered" });
    }

    await otpService.sendOtp(phone);
    ApiResponse.send(res, 200, { message: "OTP sent successfully" }, "OTP sent successfully");
};

export const verifyOtp = async (req: Request, res: Response) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
        logger.warn("Invalid request body for verify-otp", body);
        return res.status(400).json({ message: "Invalid request body" });
    }

    const { phone, otp, verifiedKey } = body as {
        phone?: string;
        otp?: string;
        verifiedKey?: string;
    };

    if (!phone || !otp) {
        logger.warn("Missing phone or otp in verify-otp request", { phone }); // Don't log OTP
        return res.status(400).json({ message: "phone and otp are required" });
    }

    logger.info(`Verifying OTP for phone: ${phone}`);

    await otpService.verifyOtp(phone, otp, verifiedKey);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
        return res.status(404).json({ message: "User not registered" });
    }

    const tokens = await issueTokens(user.id);

    // Sync Rapido Status on Login
    if (user.role === 'DRIVER') {
        const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
        if (driver) {
            rapidoService.validateAndSyncRapidoStatus(driver.id, "LOGIN")
                .catch(err => logger.error("Rapido sync failed during login", err));
        }
    }

    ApiResponse.send(res, 200, { ...tokens, user }, "OTP verified successfully");
};

export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await refreshTokenService(refreshToken);
    ApiResponse.send(res, 200, tokens, "Token refreshed successfully");
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

    ApiResponse.send(res, 200, null, "Logged out successfully");
};