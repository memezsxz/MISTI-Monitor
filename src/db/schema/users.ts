import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({autoIncrement: true}),
    name: text("name").notNull(),
    password: text("password").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
