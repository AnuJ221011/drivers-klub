import { UserRole } from "@prisma/client";

declare global {
    namespace Express {
        export interface User {
            id: string;
            role: UserRole;
        }

        export interface Request {
            user?: User;
        }
    }
}

export { };
