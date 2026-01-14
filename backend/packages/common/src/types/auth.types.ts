import type { UserRole } from "@prisma/client";

export type JwtPayload = {
    sub: string;      // user id
    role: UserRole;
    phone: string;
    fleetId?: string | null;
    hubIds?: string[];
};

export type TokenPair = {
    accessToken: string;
    refreshToken: string;
};
