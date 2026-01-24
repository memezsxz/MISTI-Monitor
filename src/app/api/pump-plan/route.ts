import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { db } from "@/db/db";
import { partLinks, parts, sensorReadings } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

type TooltipInfo = {
    title: string;
    lines: string[];
};

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

        const latestBySensor = new Map<string, { ts: string; value: number }>();
        for (const reading of readings) {
            if (!latestBySensor.has(reading.sensorPartId)) {
                latestBySensor.set(reading.sensorPartId, { ts: reading.ts, value: reading.value });
            }
        }

        const partById = new Map(partRows.map((part) => [String(part.id), part]));
        const edgesByFrom = new Map<string, string[]>();
        for (const link of partLinkRows) {
            const fromId = String(link.fromPartId);
            const toId = String(link.toPartId);
            const list = edgesByFrom.get(fromId) ?? [];
            list.push(toId);
            edgesByFrom.set(fromId, list);
        }

        const flowSensors = partRows.filter(
            (part) =>
                part.type === "sensor" &&
                typeof part.description === "object" &&
                part.description?.kind === "sensor" &&
                part.description.sensorType === "flow",
        );
        const flowValues = flowSensors
            .map((part) => latestBySensor.get(String(part.id))?.value)
            .filter((value): value is number => value != null);
        const pumpDesc = partRows.find((part) => part.type === "pump")?.description;
        const defaultFlow = pumpDesc?.kind === "pump" ? pumpDesc.flowRateLpm : undefined;
        const flowLpm = flowValues.length
            ? flowValues.reduce((sum, value) => sum + value, 0) / flowValues.length
            : defaultFlow ?? 2.5;

        const rho = 1000;
        const g = 9.81;
        const pumpHeadM = 6;
        const q = flowLpm / 1000 / 60;

        const lossForPart = (part: typeof partRows[number]) => {
            const desc = part.description;
            const v = () => {
                const dMm =
                    desc && typeof desc === "object" && "diameterMm" in desc && typeof desc.diameterMm === "number"
                        ? desc.diameterMm
                        : 25;
                const d = dMm / 1000;
                const area = Math.PI * (d * d) / 4;
                return area > 0 ? q / area : 0;
            };

            const headLoss = (k: number) => k * 0.5 * rho * v() * v();

            if (part.type === "pipe" && desc?.kind === "pipe") {
                const lengthMm = typeof desc.lengthMm === "number" ? desc.lengthMm : 0;
                const diameterMm = typeof desc.diameterMm === "number" ? desc.diameterMm : 25;
                const lengthM = lengthMm / 1000;
                const diameterM = diameterMm / 1000;
                const f = 0.02;
                return diameterM > 0 ? f * (lengthM / diameterM) * 0.5 * rho * v() * v() : 0;
            }

            if (part.type === "valve") return headLoss(2.0);
            if (part.type === "connector" && desc?.kind === "connector") {
                const k = desc.connectorType === "tee" ? 1.0 : 0.3;
                return headLoss(k);
            }
            if (part.type === "sensor") return headLoss(0.5);
            if (part.type === "tank") return headLoss(0.1);
            return 0;
        };

        const pressureById = new Map<string, number>();
        const pumpPart = partRows.find((part) => part.type === "pump");
        if (pumpPart) {
            pressureById.set(String(pumpPart.id), rho * g * pumpHeadM);
        }

        const queue: string[] = pumpPart ? [String(pumpPart.id)] : [];
        const visited = new Set<string>();
        while (queue.length) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);
            const currentPart = partById.get(currentId);
            if (!currentPart) continue;
            const currentPressure = pressureById.get(currentId);
            if (currentPressure == null) continue;
            const nextIds = edgesByFrom.get(currentId) ?? [];
            for (const nextId of nextIds) {
                const nextPressure = Math.max(0, currentPressure - lossForPart(currentPart));
                if (!pressureById.has(nextId)) {
                    pressureById.set(nextId, nextPressure);
                }
                queue.push(nextId);
            }
        }

        const payload: Record<string, TooltipInfo> = {};
        for (const part of partRows) {
            const title = part.name ?? part.elementId;
            const pressurePa = part.type === "pipe" ? pressureById.get(String(part.id)) : undefined;
            const pressureLine =
                pressurePa != null ? `Pressure: ${(pressurePa / 1000).toFixed(1)} kPa` : null;
            if (part.type === "sensor") {
                const latest = latestBySensor.get(String(part.id));
                payload[part.elementId] = latest
                    ? {
                        title,
                        lines: [
                            `Value: ${latest.value}`,
                            `Updated: ${new Date(latest.ts).toLocaleTimeString()}`,
                            ...(pressureLine ? [pressureLine] : []),
                        ],
                    }
                    : { title, lines: ["No readings available"] };
            } else {
                const desc = part.description;
                const details =
                    desc?.kind === "pipe"
                        ? [`Ø ${desc.diameterMm ?? 25} mm`, `L ${desc.lengthMm ?? 0} mm`]
                        : desc?.kind === "valve"
                        ? [`Type: ${desc.valveType ?? "valve"}`, `NO: ${desc.normallyOpen ? "Yes" : "No"}`]
                        : desc?.kind === "pump"
                        ? [`RPM: ${desc.rpm ?? 0}`, `Flow: ${desc.flowRateLpm ?? 0} L/min`]
                        : desc?.kind === "tank"
                        ? [`Volume: ${desc.volumeL ?? 0} L`, `Level: ${desc.levelPct ?? 0}%`]
                        : desc?.kind === "connector"
                        ? [`Type: ${desc.connectorType ?? "connector"}`, `Size: ${desc.sizeMm ?? 0} mm`]
                        : [`Type: ${part.type}`];
                payload[part.elementId] = {
                    title,
                    lines: [...details, ...(pressureLine ? [pressureLine] : [])],
                };
            }
        }

        return NextResponse.json(payload);
    } catch (err) {
        console.error("GET /api/pump-plan failed:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
