import type { UserRole } from "@prisma/client";

export type JwtPayload = {
    sub: string;      // user id
    role: UserRole;
    phone: string;
};

export type TokenPair = {
    accessToken: string;
    refreshToken: string;
};
