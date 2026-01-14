import { prisma } from "@driversklub/database";
import { generateTokens, verifyRefreshToken, ApiError } from "@driversklub/common";

export const issueTokens = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Resolve scope for token payload from stored user fields (no mapping tables)
    let fleetId: string | null = user.fleetId ?? null;
    let hubIds: string[] = Array.isArray(user.hubIds) ? user.hubIds : [];

    // Driver scope is derived from Driver table (profile is separate)
    if (user.role === "DRIVER") {
        const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
        if (driver) {
            fleetId = driver.fleetId ?? null;
            hubIds = driver.hubId ? [driver.hubId] : [];
        } else {
            fleetId = null;
            hubIds = [];
        }
    }

    const tokens = generateTokens({
        sub: user.id,
        role: user.role,
        phone: user.phone,
        fleetId,
        hubIds
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
        phone: payload.phone,
        fleetId: payload.fleetId ?? null,
        hubIds: payload.hubIds ?? []
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