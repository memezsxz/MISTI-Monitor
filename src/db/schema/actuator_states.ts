import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { parts } from "./parts";

export const actuatorStates = sqliteTable("actuator_states", {
    id: text("id").primaryKey(),

    partId: text("part_id")
        .notNull()
        .references(() => parts.id, { onDelete: "cascade" }),

    // TIMESTAMPTZ stored as ISO string in SQLite
    ts: text("ts").notNull(),

    // boolean stored as 0/1 in SQLite
    state: integer("state", { mode: "boolean" }).notNull(),
});

export type ActuatorState = typeof actuatorStates.$inferSelect;
export type NewActuatorState = typeof actuatorStates.$inferInsert;
