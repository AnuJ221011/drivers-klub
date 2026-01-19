import type { UserRole } from "@prisma/client";

export type JwtPayload = {
    sub: string;      // user id
    role: UserRole;
    phone: string;
    fleetId?: string | null;
    hubIds?: string[];
    clientType?: 'web' | 'app';
};

export type TokenPair = {
    accessToken: string;
    refreshToken: string;
};
