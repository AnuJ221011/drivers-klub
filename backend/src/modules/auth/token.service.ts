import { prisma } from "../../utils/prisma.js";
import { generateTokens, verifyRefreshToken } from "./jwt.util.js";
import { ApiError } from "../../utils/apiError.js";

async function storeRefreshToken(userId: string, refreshToken: string) {
    try {
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
    } catch (err: unknown) {
        // Prisma unique constraint (token already exists)
        const code = (err as { code?: string })?.code;
        if (code === "P2002") {
            throw new ApiError(409, "Refresh token collision, please retry");
        }
        throw err;
    }
}

export const issueTokens = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Retry once if a token collision somehow happens
    let tokens = generateTokens({
        sub: user.id,
        role: user.role,
        phone: user.phone
    });
    try {
        await storeRefreshToken(user.id, tokens.refreshToken);
    } catch (err) {
        if (err instanceof ApiError && err.statusCode === 409) {
            tokens = generateTokens({
                sub: user.id,
                role: user.role,
                phone: user.phone
            });
            await storeRefreshToken(user.id, tokens.refreshToken);
        } else {
            throw err;
        }
    }

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

    // Retry once if a token collision somehow happens
    let tokens = generateTokens({
        sub: payload.sub,
        role: payload.role,
        phone: payload.phone
    });

    try {
        await storeRefreshToken(payload.sub, tokens.refreshToken);
    } catch (err) {
        if (err instanceof ApiError && err.statusCode === 409) {
            tokens = generateTokens({
                sub: payload.sub,
                role: payload.role,
                phone: payload.phone
            });
            await storeRefreshToken(payload.sub, tokens.refreshToken);
        } else {
            throw err;
        }
    }

    return tokens;
};
