import { defineConfig } from "prisma/config";
import "dotenv/config";

// Prisma CLI loads this file during `prisma generate`.
// In CI/dev environments (like ephemeral workspaces) `DATABASE_URL` may be unset,
// but generating the client does not require a live DB connection.
// Provide a safe fallback so builds/lints can run without secrets.
const url =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/driversklub?schema=public";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url,
    },
});
