import type { UserRole } from "@prisma/client";

declare global {
    namespace Express {
        interface User {
            id: string;
            role: UserRole;
            fleetId?: string | null;
            hubIds?: string[];
        }

        interface Request {
            user: User;
        }
    }
}

export { };
