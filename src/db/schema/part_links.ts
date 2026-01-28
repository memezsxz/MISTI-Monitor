import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { parts } from "./parts";

export const partLinks = sqliteTable("part_links", {
    id: text("id").primaryKey(),

    fromPartId: text("from_part_id")
        .notNull()
        .references(() => parts.id, { onDelete: "cascade" }),

    toPartId: text("to_part_id")
        .notNull()
        .references(() => parts.id, { onDelete: "cascade" }),

    // relation: text("relation").notNull(),
});

export type PartLink = typeof partLinks.$inferSelect;
export type NewPartLink = typeof partLinks.$inferInsert;
