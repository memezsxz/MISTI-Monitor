// src/db/schema/ai_chat.ts
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const aiChat = sqliteTable("ai_chat", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    question: text("question").notNull(),
    answer: text("answer").notNull(),

    createdAt: text("created_at")
        .notNull()
        .default(sql`(datetime('now'))`),
});

export type AiChatRow = typeof aiChat.$inferSelect;
export type NewAiChatRow = typeof aiChat.$inferInsert;
