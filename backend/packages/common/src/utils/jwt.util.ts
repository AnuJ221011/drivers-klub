import jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import type { JwtPayload, TokenPair } from "../types/auth.types.js";
import { ApiError } from "./apiError.js";

export type ExpiresIn = SignOptions["expiresIn"];

const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES_IN,
} = process.env;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET || !ACCESS_TOKEN_EXPIRES_IN) {
    throw new Error("JWT secrets or Expiry time are not configured in environment variables");
}

// Token Expiration Times
// need to change to .env file soon


// Generate Access + Refresh tokens
export const generateTokens = (payload: JwtPayload, refreshExpiresIn: string): TokenPair => {
    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET as string, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN as ExpiresIn
    });

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET as string, {
        expiresIn: refreshExpiresIn as any
    });

    return { accessToken, refreshToken };
};

// Verify Access Token
export const verifyAccessToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_ACCESS_SECRET as string) as JwtPayload;
    } catch {
        throw new ApiError(401, "Invalid or expired access token");
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET as string) as JwtPayload;
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
};
