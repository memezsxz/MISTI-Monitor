import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const partTypes = ['valve', 'pipe', 'sensor', 'pump', 'tank', 'connector'] as const;

export const parts = sqliteTable("parts", {
    id: integer("id").primaryKey({autoIncrement: true}),

    // part_types merged here
    type: text('type', { enum: partTypes }).notNull(),

    name: text("name"),

    description: text("description").default(""),
    elementId: text("svg_element_id").notNull().unique(),
});

export type Part = typeof parts.$inferSelect;
export type NewPart = typeof parts.$inferInsert;
