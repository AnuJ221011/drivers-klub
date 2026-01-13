import { prisma } from "../../utils/prisma.js";
import { generateTokens, verifyRefreshToken } from "./jwt.util.js";
import { ApiError } from "../../utils/apiError.js";

async function resolveScope(user: { id: string; role: any; phone: string; fleetId?: string | null; hubIds?: string[] }) {
    const role = user.role;
    if (role === "SUPER_ADMIN") return {};

    if (role === "DRIVER") {
        const driver = await prisma.driver.findFirst({
            where: { userId: user.id },
            select: { fleetId: true, hubId: true },
        });
        if (!driver) throw new ApiError(403, "Driver profile not found for user");
        return { fleetId: driver.fleetId, hubIds: driver.hubId ? [driver.hubId] : [] };
    }

    if (role === "FLEET_ADMIN" || role === "MANAGER") {
        if (!user.fleetId) throw new ApiError(403, "User is not assigned to a fleet");
        return { fleetId: user.fleetId, hubIds: [] as string[] };
    }

    if (role === "OPERATIONS") {
        if (!user.fleetId) throw new ApiError(403, "User is not assigned to a fleet");
        const hubIds = Array.isArray(user.hubIds) ? user.hubIds : [];
        if (hubIds.length === 0) throw new ApiError(403, "Operations user is not assigned to any hubs");
        return { fleetId: user.fleetId, hubIds };
    }

    // Unknown/unsupported roles get no scope
    return {};
}

export const issueTokens = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const scope = await resolveScope(user);

    const tokens = generateTokens({
        sub: user.id,
        role: user.role,    
        phone: user.phone,
        ...scope
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
    await prisma.refreshToken.delete({ where: { token: refreshTokenInput } });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ApiError(404, "User not found");

    const scope = await resolveScope(user);

    const tokens = generateTokens({
        sub: user.id,
        role: user.role,
        phone: user.phone,
        ...scope
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