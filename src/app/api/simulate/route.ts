import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { db } from "@/db/db";
import { parts, sensorReadings } from "@/db/schema";
import { analyzePumpSample, type PumpCondition, type PumpPredictionSample } from "@/lib/aiAnalize";
import {
    getRangesForCondition,
    type SensorKey,
    type SensorRange,
} from "@/lib/aiScenarioRanges";
import { inArray } from "drizzle-orm";
import { formatLocalDateTime } from "@/lib/localDate";

const scenarioMap: Record<string, PumpCondition> = {
    normal: "normal",
    block: "block",
    blockage: "block",
    leak: "leak",
    overheat: "temp",
    temp: "temp",
    pumpfail: "pumpFail",
    pumpFail: "pumpFail",
};

const sensorElementToKey: Record<string, SensorKey> = {
    sensor_1: "flow_1",
    sensor_2: "temp_1",
    sensor_3: "flow_2",
    sensor_4: "temp_2",
    sensor_5: "temp_3",
    sensor_6: "flow_3",
    sensor_7: "temp_4",
    sensor_8: "flow_4",
};

function pickValue(range: SensorRange): number {
    const min = range.min ?? range.max ?? 0;
    const max = range.max ?? range.min ?? 0;
    if (min === max) return Number(min.toFixed(3));
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    const value = low + Math.random() * (high - low);
    return Number(value.toFixed(3));
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const requestedId = typeof body?.scenario === "string" ? body.scenario : "normal";
        const scenario =
            scenarioMap[requestedId as keyof typeof scenarioMap] ?? scenarioMap.normal;

        const ranges = getRangesForCondition(scenario);
        const baseSample = {
            flow_1: pickValue(ranges.flow_1),
            temp_1: pickValue(ranges.temp_1),
            flow_2: pickValue(ranges.flow_2),
            temp_2: pickValue(ranges.temp_2),
            flow_3: pickValue(ranges.flow_3),
            temp_3: pickValue(ranges.temp_3),
            flow_4: pickValue(ranges.flow_4),
            temp_4: pickValue(ranges.temp_4),
            vfd: pickValue(ranges.vfd),
        };

        const predicted = analyzePumpSample({
            temp_1: baseSample.temp_1,
            flow_1: baseSample.flow_1,
            flow_2: baseSample.flow_2,
            flow_3: baseSample.flow_3,
            flow_4: baseSample.flow_4,
        });

        const sensorElementIds = Object.keys(sensorElementToKey);
        const rows = await db
            .select({ id: parts.id, elementId: parts.elementId })
            .from(parts)
            .where(inArray(parts.elementId, sensorElementIds));

        const idByElement = new Map(rows.map((row) => [row.elementId, row.id]));
        const now = Date.now();
        const inserts = sensorElementIds.map((elementId, idx) => {
            const partId = idByElement.get(elementId);
            if (!partId) {
                throw new Error(`Missing part id for ${elementId}`);
            }
            const key = sensorElementToKey[elementId];
            const value = baseSample[key];
            return {
                id: randomUUID(),
                sensorPartId: String(partId),
                ts: formatLocalDateTime(now + idx * 1000),
                value,
            };
        });

        await db.insert(sensorReadings).values(inserts);

        return NextResponse.json({
            ok: true,
            scenario,
            predicted,
            readingsInserted: inserts.length,
        });
    } catch (err) {
        console.error("POST /api/simulate failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
