import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {sql} from "drizzle-orm";

export const notifications = sqliteTable("notifications", {
    id: integer("id").primaryKey({autoIncrement: true}),

    level: text("level", {enum: ["low", "medium", "high"]}).notNull(),

    title: text("title").notNull(),
    message: text("message").notNull(),

    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    acknowledgedAt: text("acknowledged_at"),
    resolvedAt: text("resolved_at"),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
