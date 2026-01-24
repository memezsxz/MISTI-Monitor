import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { parts } from "./parts";

export const sensorReadings = sqliteTable("sensor_readings", {
    id: text("id").primaryKey(),

    sensorPartId: text("sensor_part_id")
        .notNull()
        .references(() => parts.id, { onDelete: "cascade" }),

    // TIMESTAMPTZ stored as ISO string in SQLite
    ts: text("ts").notNull(),

    value: real("value").notNull(),
});

export type SensorReading = typeof sensorReadings.$inferSelect;
export type NewSensorReading = typeof sensorReadings.$inferInsert;
