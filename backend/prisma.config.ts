import { defineConfig } from "prisma/config";
import "dotenv/config";

/**
 * Prisma CLI (generate/build) should not hard-fail when DATABASE_URL is missing.
 * `prisma generate` does not need a live DB connection, but it does require a
 * syntactically valid URL. We fall back to a local placeholder.
 *
 * Runtime DB configuration is handled in `src/utils/prisma.ts`.
 */
const url =
    process.env.DATABASE_URL ||
    "postgresql://user:pass@localhost:5432/postgres?schema=public";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url,
    },
});
