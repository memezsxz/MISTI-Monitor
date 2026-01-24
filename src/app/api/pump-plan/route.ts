import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { db } from "@/db/db";
import { partLinks, parts, sensorReadings } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { buildTooltipForPart, computePressures, type TooltipInfo } from "@/lib/pumpPlanData";

export async function GET() {
    try {
        const partRows = await db
            .select({
                id: parts.id,
                elementId: parts.elementId,
                name: parts.name,
                type: parts.type,
                description: parts.description,
            })
            .from(parts);

        const partLinkRows = await db
            .select({ fromPartId: partLinks.fromPartId, toPartId: partLinks.toPartId })
            .from(partLinks);

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

        const { pressureById, latestBySensor } = computePressures(partRows, partLinkRows, readings);

        const payload: Record<string, TooltipInfo> = {};
        for (const part of partRows) {
            payload[part.elementId] = buildTooltipForPart(part, pressureById, latestBySensor);
        }

        return NextResponse.json(payload);
    } catch (err) {
        console.error("GET /api/pump-plan failed:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
