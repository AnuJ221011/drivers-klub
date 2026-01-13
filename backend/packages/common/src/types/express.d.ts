import type { UserRole } from "@prisma/client";

declare global {
    namespace Express {
        interface User {
            id: string;
            role: UserRole;
        }

        interface Request {
            user: User;
        }
    }
}
