import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { db } from "@/db/db";
import { partLinks, parts, sensorReadings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { buildTooltipForPart, computePressures } from "@/lib/pumpPlanData";

export async function GET(
    req: Request,
    { params }: { params?: Promise<{ elementId: string }> },
) {
    try {
        const elementId =
            (params ? (await params).elementId : undefined) ??
            new URL(req.url).pathname.split("/").pop();
        if (!elementId) {
            return NextResponse.json({ error: "Missing elementId" }, { status: 400 });
        }
        const partRows = await db
            .select({
                id: parts.id,
                elementId: parts.elementId,
                name: parts.name,
                type: parts.type,
                description: parts.description,
            })
            .from(parts);

        const [directPart] = await db
            .select({
                id: parts.id,
                elementId: parts.elementId,
                name: parts.name,
                type: parts.type,
                description: parts.description,
            })
            .from(parts)
            .where(eq(parts.elementId, elementId))
            .limit(1);

        const part = directPart ?? partRows.find((row) => row.elementId === elementId);
        if (!part) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const partLinkRows = await db
            .select({ fromPartId: partLinks.fromPartId, toPartId: partLinks.toPartId })
            .from(partLinks);

        const readings = await db
            .select({
                sensorPartId: sensorReadings.sensorPartId,
                ts: sensorReadings.ts,
                value: sensorReadings.value,
            })
            .from(sensorReadings)
            .orderBy(desc(sensorReadings.ts));

        const { pressureById, latestBySensor } = computePressures(partRows, partLinkRows, readings);
        const tooltip = buildTooltipForPart(part, pressureById, latestBySensor);

        return NextResponse.json({ part, tooltip });
    } catch (err) {
        console.error("GET /api/parts/[elementId] failed:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
