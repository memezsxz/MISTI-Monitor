import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { db } from "@/db/db";
import { parts, sensorReadings } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

type TooltipInfo = {
    title: string;
    lines: string[];
};

export async function GET() {
    try {
        const partRows = await db
            .select({ id: parts.id, elementId: parts.elementId, name: parts.name, type: parts.type })
            .from(parts);

        const sensorPartIds = partRows
            .filter((part) => part.type === "sensor")
            .map((part) => String(part.id));

        const readings = sensorPartIds.length
            ? await db
                .select({
                    sensorPartId: sensorReadings.sensorPartId,
                    ts: sensorReadings.ts,
                    value: sensorReadings.value,
                })
                .from(sensorReadings)
                .where(inArray(sensorReadings.sensorPartId, sensorPartIds))
                .orderBy(desc(sensorReadings.ts))
            : [];

        const latestBySensor = new Map<string, { ts: string; value: number }>();
        for (const reading of readings) {
            if (!latestBySensor.has(reading.sensorPartId)) {
                latestBySensor.set(reading.sensorPartId, { ts: reading.ts, value: reading.value });
            }
        }

        const payload: Record<string, TooltipInfo> = {};
        for (const part of partRows) {
            const title = part.name ?? part.elementId;
            if (part.type === "sensor") {
                const latest = latestBySensor.get(String(part.id));
                payload[part.elementId] = latest
                    ? {
                        title,
                        lines: [
                            `Value: ${latest.value}`,
                            `Updated: ${new Date(latest.ts).toLocaleTimeString()}`,
                        ],
                    }
                    : { title, lines: ["No readings available"] };
            } else {
                payload[part.elementId] = {
                    title,
                    lines: [`Type: ${part.type}`],
                };
            }
        }

        return NextResponse.json(payload);
    } catch (err) {
        console.error("GET /api/pump-plan failed:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
