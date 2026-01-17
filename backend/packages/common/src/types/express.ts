import type { UserRole } from "@prisma/client";

// Ensure this file is treated as a module (so global augmentation is applied predictably)
export {};

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
      fleetId?: string | null;
      hubIds?: string[];
    }
  }
}

// Augment the actual `express` Request type (`express-serve-static-core`)
// so `req.user` is available across services.
declare module "express-serve-static-core" {
  interface Request {
    user?: Express.User;
  }
}

