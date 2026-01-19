import { defineConfig } from "prisma/config";
import "dotenv/config";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not defined in .env");
}

export default defineConfig({
    schema: "packages/database/prisma/schema.prisma",
    datasource: {
        url,
    },
});
