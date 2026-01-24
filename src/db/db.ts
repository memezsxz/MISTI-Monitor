import {drizzle} from 'drizzle-orm/libsql';
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import "dotenv/config";

const url = process.env.DB_FILE_NAME;
if (!url) throw new Error("DB_FILE_NAME is missing. Add it to .env");

const client = createClient({
    url: url,
});

export const db = drizzle(client, {schema});
