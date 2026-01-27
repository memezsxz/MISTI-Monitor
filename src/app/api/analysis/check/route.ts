import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { db } from "@/db/db";
import { notifications, parts, sensorReadings } from "@/db/schema";
import { analyzePumpSample, type PumpPredictionSample, type PumpCondition } from "@/lib/aiAnalize";
import { desc, inArray } from "drizzle-orm";

const elementToSampleKey: Record<string, keyof PumpPredictionSample> = {
    sensor_1: "flow_1",
    sensor_2: "temp_1",
    sensor_3: "flow_2",
    // sensor_4: "temp_2",
    // sensor_5: "temp_3",
    sensor_6: "flow_3",
    // sensor_7: "temp_4",
    sensor_8: "flow_4",
};

const issueMeta: Record<Exclude<PumpCondition, "normal">, { title: string; message: string; level: "low" | "medium" | "high" }> = {
    block: {
        title: "Possible blockage detected",
        message: "AI analysis flagged a blockage signature. Inspect valves and piping for restrictions.",
        level: "high",
    },
    leak: {
        title: "Possible leak detected",
        message: "Sensor readings resemble a leak condition. Inspect lines and joints for drips or loose fittings.",
        level: "high",
    },
    temp: {
        title: "Over-temperature pattern",
        message: "Temperatures exceeded the safe envelope. Verify heaters, insulation, and cooling loop.",
        level: "high",
    },
    pumpFail: {
        title: "Pump failure signature",
        message: "AI detected a pump failure pattern. Check pump power, priming, and mechanical state immediately.",
        level: "high",
    },
};

export async function POST() {
    try {
        const sensorRows = await db
            .select({ id: parts.id, elementId: parts.elementId })
            .from(parts)
            .where(inArray(parts.elementId, Object.keys(elementToSampleKey)));

        if (sensorRows.length !== Object.keys(elementToSampleKey).length) {
            return NextResponse.json({ error: "Sensor configuration incomplete" }, { status: 500 });
        }

        const elementByPartId = new Map(sensorRows.map((row) => [String(row.id), row.elementId]));
        const partIds = sensorRows.map((row) => String(row.id));

        const readings = await db
            .select({ sensorPartId: sensorReadings.sensorPartId, value: sensorReadings.value, ts: sensorReadings.ts })
            .from(sensorReadings)
            .where(inArray(sensorReadings.sensorPartId, partIds))
            .orderBy(desc(sensorReadings.ts))
            .limit(partIds.length * 3);

        const latestSample: Partial<PumpPredictionSample> = {};
        for (const reading of readings) {
            const element = elementByPartId.get(reading.sensorPartId);
            if (!element) continue;
            const key = elementToSampleKey[element];
            if (!key || key in latestSample) continue;
            latestSample[key] = reading.value;
        }

        const missingField = (Object.keys(elementToSampleKey) as Array<keyof typeof elementToSampleKey>).find((el) => {
            const key = elementToSampleKey[el];
            return latestSample[key] == null;
        });

        if (missingField) {
            return NextResponse.json({ error: `Missing reading for ${missingField}` }, { status: 422 });
        }

        const prediction = analyzePumpSample(latestSample as PumpPredictionSample);
        if (prediction === "normal") {
            return NextResponse.json({ predicted: prediction, notified: false });
        }

        const meta = issueMeta[prediction];
        if (!meta) {
            return NextResponse.json({ predicted: prediction, notified: false });
        }

        const latestNotification = await db
            .select({
                id: notifications.id,
                title: notifications.title,
            })
            .from(notifications)
            .orderBy(desc(notifications.createdAt))
            .limit(1);

        if (latestNotification[0]?.title === meta.title) {
            return NextResponse.json({ predicted: prediction, notified: false, issue: meta });
        }

        await db.insert(notifications).values({
            level: meta.level,
            title: meta.title,
            message: meta.message,
        });

        return NextResponse.json({ predicted: prediction, notified: true, issue: meta });
    } catch (err) {
        console.error("POST /api/analysis/check failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
