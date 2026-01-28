import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { db } from "@/db/db";
import { partLinks, parts, sensorReadings } from "@/db/schema";
import { asc, and, desc, eq, gt } from "drizzle-orm";
import { buildTooltipForPart, computePressures } from "@/lib/pumpPlanData";
import { formatLocalDateTime } from "@/lib/localDate";

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

        let history: { ts: string; value: number | null }[] = [];
        if (part.type === "sensor") {
            const bucketSizeMs = 10 * 60 * 1000;
            const bucketCount = 12;
            const nowMs = Date.now();
            const alignedEndMs = Math.floor(nowMs / bucketSizeMs) * bucketSizeMs;
            const startMs = alignedEndMs - bucketSizeMs * bucketCount;
            const cutoff = formatLocalDateTime(startMs);

            const rawHistory = await db
                .select({
                    ts: sensorReadings.ts,
                    value: sensorReadings.value,
                })
                .from(sensorReadings)
                .where(
                    and(
                        eq(sensorReadings.sensorPartId, String(part.id)),
                        gt(sensorReadings.ts, cutoff),
                    ),
                )
                .orderBy(asc(sensorReadings.ts));

            const parsed = rawHistory
                .map((item) => ({
                    ts: item.ts,
                    ms: new Date(item.ts).getTime(),
                    value: item.value,
                }))
                .filter((item) => Number.isFinite(item.ms) && Number.isFinite(item.value));

            history = Array.from({ length: bucketCount }).map((_, idx) => {
                const bucketStart = startMs + idx * bucketSizeMs;
                const bucketEnd = bucketStart + bucketSizeMs;
                const bucketValues = parsed.filter(
                    (entry) => entry.ms >= bucketStart && entry.ms < bucketEnd,
                );
                const avg =
                    bucketValues.length > 0
                        ? bucketValues.reduce((sum, entry) => sum + entry.value, 0) /
                          bucketValues.length
                        : null;
                return {
                    ts: formatLocalDateTime(bucketEnd),
                    value: avg,
                };
            });
        }

        return NextResponse.json({ part, tooltip, history });
    } catch (err) {
        console.error("GET /api/parts/[elementId] failed:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
