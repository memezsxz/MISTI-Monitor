import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const partTypes = ['valve', 'pipe', 'sensor', 'pump', 'tank', 'connector'] as const;

export type PartDescription =
    | {
          kind: "pipe";
          material?: string;
          diameterMm?: number;
          lengthMm?: number;
          maxPressureBar?: number;
          insulation?: { type?: string; thicknessMm?: number };
          installDate?: string;
          inspectionDue?: string;
      }
    | {
          kind: "valve";
          valveType?: string;
          sizeMm?: number;
          positionPct?: number;
          normallyOpen?: boolean;
          Cv?: number;
          installDate?: string;
          cycleCount?: number;
          maintenanceDue?: string;
      }
    | {
          kind: "sensor";
          sensorType?: string;
          unit?: string;
          range?: { min?: number; max?: number };
          accuracyPct?: number;
          lastCalibratedAt?: string;
          installDate?: string;
          calibrationDue?: string;
      }
    | {
          kind: "pump";
          model?: string;
          rpm?: number;
          flowRateLpm?: number;
          headM?: number;
          powerKw?: number;
          efficiencyPct?: number;
          installDate?: string;
          lastServiceAt?: string;
          maintenanceDue?: string;
      }
    | {
          kind: "tank";
          volumeL?: number;
          material?: string;
          maxTempC?: number;
          levelPct?: number;
          installDate?: string;
          inspectionDue?: string;
      }
    | {
          kind: "connector";
          connectorType?: string;
          sizeMm?: number;
          material?: string;
          installDate?: string;
      };

export const parts = sqliteTable("parts", {
    id: integer("id").primaryKey({autoIncrement: true}),

    // part_types merged here
    type: text('type', { enum: partTypes }).notNull(),

    name: text("name"),

    description: text("description", { mode: "json" }).$type<PartDescription | null>(),

    elementId: text("svg_element_id").notNull().unique(),
});

export type Part = typeof parts.$inferSelect;
export type NewPart = typeof parts.$inferInsert;
