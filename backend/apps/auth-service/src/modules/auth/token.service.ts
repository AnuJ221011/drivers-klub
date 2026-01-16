import { prisma } from "@driversklub/database";
import { generateTokens, verifyRefreshToken, ApiError } from "@driversklub/common";

async function resolveScope(user: { id: string; role: string; fleetId: string | null; hubIds: unknown }) {
    // Resolve scope for token payload from stored user fields (no mapping tables)
    let fleetId: string | null = user.fleetId ?? null;
    let hubIds: string[] = Array.isArray(user.hubIds) ? (user.hubIds as string[]) : [];

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

    return { fleetId, hubIds };
}

export const issueTokens = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const { fleetId, hubIds } = await resolveScope(user as any);

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

    // Always re-resolve scope from DB so tokens reflect latest fleet/hub assignments.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const { fleetId, hubIds } = await resolveScope(user as any);

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