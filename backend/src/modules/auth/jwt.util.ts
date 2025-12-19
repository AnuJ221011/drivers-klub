import jwt from "jsonwebtoken";
import type { JwtPayload, TokenPair } from "./auth.types.js";
import { ApiError } from "../../utils/apiError.js";

const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET
} = process.env;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets are not configured in environment variables");
}

// Token Expiration Times
// need to change to .env file soon
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

// Generate Access + Refresh tokens
export const generateTokens = (payload: JwtPayload): TokenPair => {
    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN
    });

    return { accessToken, refreshToken };
};

// Verify Access Token
export const verifyAccessToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
    } catch {
        throw new ApiError(401, "Invalid or expired access token");
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
};
