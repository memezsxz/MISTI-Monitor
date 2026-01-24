import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const shifts = sqliteTable("shifts", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    // login time
    startedAt: text("started_at")
        .notNull()
        .default(sql`(datetime('now'))`),

    // logout time (null while active)
    endedAt: text("ended_at"),

    // optional: shift summary, handover note, etc.
    note: text("note"),
});

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
