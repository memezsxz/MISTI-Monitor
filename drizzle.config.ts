import type { Config } from "drizzle-kit";

export default {
    schema: "./src/db/schema",
    out: "./src/db/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: process.env.DB_FILE_NAME!,
    },
} satisfies Config;
