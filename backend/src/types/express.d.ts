import type { UserRole } from "@prisma/client";

declare global {
    namespace Express {
        interface User {
            id: string;
            role: UserRole;
            phone?: string;
            /** Scoped roles (MANAGER/OPERATIONS/DRIVER) */
            fleetId?: string;
            /** OPERATIONS (hub manager) may have 1..n hubs */
            hubIds?: string[];
        }

        interface Request {
            user: User;
        }
    }
}
