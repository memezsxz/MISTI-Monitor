import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { shifts } from "./shifts";

export const turnoverNotes = sqliteTable("turnover_notes", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    shiftId: integer("shift_id")
        .notNull()
        .references(() => shifts.id, { onDelete: "cascade" }),

    text: text("text").notNull(),

    createdAt: text("created_at")
        .notNull()
        .default(sql`(datetime('now'))`),

    updatedAt: text("updated_at"),
});

export type TurnoverNote = typeof turnoverNotes.$inferSelect;
export type NewTurnoverNote = typeof turnoverNotes.$inferInsert;
