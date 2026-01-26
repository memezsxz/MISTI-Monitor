import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { parts } from "./parts";

export const sensorReadings = sqliteTable("sensor_readings", {
    id: text("id").primaryKey(),

    sensorPartId: text("sensor_part_id")
        .notNull()
        .references(() => parts.id, { onDelete: "cascade" }),

    // Local timestamp string (YYYY-MM-DD HH:MM:SS)
    ts: text("ts").notNull(),

    value: real("value").notNull(),
});

export type SensorReading = typeof sensorReadings.$inferSelect;
export type NewSensorReading = typeof sensorReadings.$inferInsert;
