import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const failureEvents = sqliteTable("failure_events", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["top", "intermediate", "basic", "failure_mode", "gate_and", "gate_or"] }).notNull(),
    description: text("description"),
    probability: real("probability"),
    severity: text("severity", { enum: ["low", "medium", "high", "critical"] }),
    detection: text("detection", { enum: ["low", "medium", "high"] }),
    metadata: text("metadata"), // JSON-serialized metadata blob
    tags: text("tags"), // JSON-serialized string array
});

export const failureEventLinks = sqliteTable("failure_event_links", {
    id: text("id").primaryKey(),
    fromEventId: text("from_event_id")
        .notNull()
        .references(() => failureEvents.id, { onDelete: "cascade" }),
    toEventId: text("to_event_id")
        .notNull()
        .references(() => failureEvents.id, { onDelete: "cascade" }),
    linkType: text("link_type"), // optional metadata (default edges, inhibitors, etc.)
    metadata: text("metadata"),
});

export type FailureEventRow = typeof failureEvents.$inferSelect;
export type NewFailureEventRow = typeof failureEvents.$inferInsert;
export type FailureEventLinkRow = typeof failureEventLinks.$inferSelect;
export type NewFailureEventLinkRow = typeof failureEventLinks.$inferInsert;
