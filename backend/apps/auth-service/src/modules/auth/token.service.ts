import { prisma } from "@driversklub/database";
import { generateTokens, verifyRefreshToken, ApiError } from "@driversklub/common";

export const issueTokens = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const tokens = generateTokens({
        sub: user.id,
        role: user.role,
        phone: user.phone
    });

    await prisma.refreshToken.create({
        data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    return tokens;
};

export const refresh = async (refreshTokenInput: string) => {
    const payload = verifyRefreshToken(refreshTokenInput);

    const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshTokenInput }
    });

    if (!stored) {
        throw new ApiError(401, "Invalid refresh token");
    }

    // rotate
    // rotate
    try {
        await prisma.refreshToken.delete({ where: { token: refreshTokenInput } });
    } catch {
        // Ignore delete error (idempotent)
    }

    const tokens = generateTokens({
        sub: payload.sub,
        role: payload.role,
        phone: payload.phone
    });

    await prisma.refreshToken.create({
        data: {
            token: tokens.refreshToken,
            userId: payload.sub,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    return tokens;
};

export const revokeRefreshToken = async (refreshToken: string) => {
    if (!refreshToken) return;
    await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
    });
};

export const revokeAllUserTokens = async (userId: string) => {
    if (!userId) return;
    await prisma.refreshToken.deleteMany({
        where: { userId }
    });
};