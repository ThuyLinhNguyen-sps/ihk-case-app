import "dotenv/config";
import { defineConfig } from "prisma/config";

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres")) {
  throw new Error("DATABASE_URL is missing/invalid. Must start with postgres:// or postgresql://");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL },
});
