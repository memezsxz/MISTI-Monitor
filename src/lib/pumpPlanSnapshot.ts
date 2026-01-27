import { db } from "@/db/db";
import { partLinks, parts, sensorReadings } from "@/db/schema";
import { analyzePumpSample, type PumpCondition, type PumpPredictionSample } from "@/lib/aiAnalize";
import {
    buildTooltipForPart,
    computePressures,
    type PartLinkRow,
    type PartRow,
    type SensorReadingRow,
    type TooltipInfo,
} from "@/lib/pumpPlanData";
import { desc, inArray } from "drizzle-orm";
import type { PumpPlanMetrics, StatusSeverity } from "@/types/pumpPlan";

type SnapshotResult = {
    tooltips: Record<string, TooltipInfo>;
    metrics: PumpPlanMetrics;
};

const statusMeta: Record<PumpCondition, { label: string; severity: StatusSeverity }> = {
    normal: { label: "Stable", severity: "normal" },
    leak: { label: "Leak Suspected", severity: "warning" },
    block: { label: "Blockage Risk", severity: "critical" },
    temp: { label: "Overheat Risk", severity: "critical" },
    pumpFail: { label: "Pump Failure", severity: "critical" },
};

const statusSensorMap: Record<string, keyof PumpPredictionSample> = {
    sensor_1: "flow_1",
    sensor_2: "temp_1",
    sensor_3: "flow_2",
    sensor_6: "flow_3",
    sensor_8: "flow_4",
};

export async function loadPumpPlanSnapshot(): Promise<SnapshotResult> {
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

    const sensorPartIds = partRows.filter((part) => part.type === "sensor").map((part) => String(part.id));

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

    const { pressureById, latestBySensor, flowLpm } = computePressures(
        partRows as PartRow[],
        partLinkRows as PartLinkRow[],
        readings as SensorReadingRow[],
    );

    const tooltips: Record<string, TooltipInfo> = {};
    for (const part of partRows as PartRow[]) {
        tooltips[part.elementId] = buildTooltipForPart(part, pressureById, latestBySensor);
    }

    const metrics = buildMetrics(partRows as PartRow[], pressureById, latestBySensor, flowLpm);

    return { tooltips, metrics };
}

function buildMetrics(
    partsList: PartRow[],
    pressureById: Map<string, number>,
    latestBySensor: Map<string, SensorReadingRow>,
    flowLpm: number,
): PumpPlanMetrics {
    const temperatureSensors = partsList.filter(
        (part) =>
            part.type === "sensor" &&
            typeof part.description === "object" &&
            part.description?.kind === "sensor" &&
            part.description.sensorType === "temperature",
    );

    const temperatureValues = temperatureSensors
        .map((part) => latestBySensor.get(String(part.id))?.value)
        .filter((value): value is number => typeof value === "number");

    const avgTemp =
        temperatureValues.length > 0
            ? temperatureValues.reduce((sum, value) => sum + value, 0) / temperatureValues.length
            : null;

    const pumpPart = partsList.find((part) => part.type === "pump");
    const pumpPressurePa = pumpPart ? pressureById.get(String(pumpPart.id)) : undefined;
    const pressureKpa =
        typeof pumpPressurePa === "number" && Number.isFinite(pumpPressurePa)
            ? Number((pumpPressurePa / 1000).toFixed(1))
            : null;

    const status = deriveStatus(partsList, latestBySensor);
    const latestTs = Array.from(latestBySensor.values()).reduce<string | null>((acc, reading) => {
        if (!acc || reading.ts > acc) return reading.ts;
        return acc;
    }, null);

    return {
        flowLpm: Number.isFinite(flowLpm) ? Number(flowLpm.toFixed(2)) : null,
        temperatureC: avgTemp != null ? Number(avgTemp.toFixed(1)) : null,
        pressureKpa,
        status,
        updatedAt: latestTs,
    };
}

function deriveStatus(
    partsList: PartRow[],
    latestBySensor: Map<string, SensorReadingRow>,
): PumpPlanMetrics["status"] {
    const partIdByElement = new Map(partsList.map((part) => [part.elementId, String(part.id)]));
    const requiredKeys = new Set(Object.values(statusSensorMap));
    const sample: Partial<PumpPredictionSample> = {};

    for (const [elementId, key] of Object.entries(statusSensorMap)) {
        const partId = partIdByElement.get(elementId);
        if (!partId) continue;
        const latest = latestBySensor.get(partId);
        if (latest?.value == null) continue;
        if (sample[key] == null) {
            sample[key] = latest.value;
        }
    }

    const missingKey = Array.from(requiredKeys).find((key) => sample[key] == null);
    if (missingKey) {
        return { code: "unknown", label: "Insufficient data", severity: "unknown" };
    }

    const prediction = analyzePumpSample(sample as PumpPredictionSample);
    const meta = statusMeta[prediction];
    if (!meta) {
        return { code: "unknown", label: "Unknown", severity: "unknown" };
    }

    return { code: prediction, ...meta };
}
