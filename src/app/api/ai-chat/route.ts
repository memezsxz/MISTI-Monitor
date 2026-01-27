export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { db } from "@/db/db";
import { aiChat } from "@/db/schema/ai_chat";
import { sensorReadings } from "@/db/schema";
import pumpPlanStore from "@/data/pump-plan-store.json";
import { gte } from "drizzle-orm";
import { formatLocalDateTime } from "@/lib/localDate";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "deepseek-r1:8b";
const aiLogicFiles = [
    resolve(process.cwd(), "src", "lib", "aiAnalize.ts"),
    resolve(process.cwd(), "src", "lib", "aiScenarioRanges.ts"),
];
const aiLogicContext = aiLogicFiles
    .map((file) => {
        try {
            return `File: ${file}\n${readFileSync(file, "utf8")}`;
        } catch (err) {
            console.warn("Could not load AI logic file:", file, err);
            return "";
        }
    })
    .filter(Boolean)
    .join("\n\n");

type PumpPlanEntry = {
    id: number;
    elementId: string;
    name: string | null;
    type: string;
    description: unknown;
    connections: {
        from: Array<{ partId: number | string; elementId?: string; type?: string; name?: string | null }>;
        to: Array<{ partId: number | string; elementId?: string; type?: string; name?: string | null }>;
    };
};

const pumpPlanEntries = pumpPlanStore as PumpPlanEntry[];
const pumpPlanById = new Map(pumpPlanEntries.map((entry) => [String(entry.id), entry]));

const pumpPlanContext = pumpPlanEntries
    .map((part) => {
        const inputs =
            part.connections.from.length > 0
                ? part.connections.from
                      .map((conn) => conn.elementId ?? `part_${conn.partId}`)
                      .join(", ")
                : "none";
        const outputs =
            part.connections.to.length > 0
                ? part.connections.to
                      .map((conn) => conn.elementId ?? `part_${conn.partId}`)
                      .join(", ")
                : "none";
        const desc =
            typeof part.description === "string"
                ? part.description
                : JSON.stringify(part.description ?? {});

        return `Part ${part.elementId} (${part.type}): name=${part.name ?? "n/a"}, description=${desc}, inputs=[${inputs}], outputs=[${outputs}]`;
    })
    .join("\n");

async function buildSensorContext(): Promise<string> {
    const cutoff = formatLocalDateTime(Date.now() - 60 * 60 * 1000);
    const rows = await db
        .select({
            sensorPartId: sensorReadings.sensorPartId,
            value: sensorReadings.value,
            ts: sensorReadings.ts,
        })
        .from(sensorReadings)
        .where(gte(sensorReadings.ts, cutoff));

    if (rows.length === 0) {
        return "No sensor readings recorded in the past hour.";
    }

    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
        const key = String(row.sensorPartId);
        const bucket = grouped.get(key) ?? [];
        bucket.push(row);
        grouped.set(key, bucket);
    }

    const sections: string[] = [];
    for (const [partId, readings] of grouped) {
        readings.sort((a, b) => a.ts.localeCompare(b.ts));
        const values = readings.map((r) => r.value);
        const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const latest = readings[readings.length - 1];
        const entry = pumpPlanById.get(partId);
        const label = entry
            ? `${entry.elementId} (${entry.type}${entry.name ? `, ${entry.name}` : ""})`
            : `sensor_part_${partId}`;

        sections.push(
            `${label}: samples=${values.length}, avg=${avg.toFixed(3)}, min=${min.toFixed(
                3,
            )}, max=${max.toFixed(3)}, latest=${latest.value.toFixed(3)} @ ${latest.ts}`,
        );
    }

    return sections.join("\n");
}

function buildPrompt(question: string, sensorContext: string) {
    return [
        "System: You are an assistant for the Misti pump plan. Use only the provided context to answer questions about this system. If the question is unrelated or the context does not contain the information, reply exactly with: Please ask questions related to the system.",
        "Context:",
        pumpPlanContext,
        "Failure analysis logic:",
        aiLogicContext || "Unavailable",
        "Sensor readings (past hour):",
        sensorContext,
        "User question:",
        question,
        "Answer with clear steps tied back to the context.",
    ].join("\n\n");
}

async function generateAnswer(prompt: string): Promise<string> {
    const baseUrl = (process.env.OLLAMA_URL ?? DEFAULT_OLLAMA_URL).replace(/\/$/, "");
    const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
    const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            prompt,
            stream: true,
        }),
    });

    if (!res.ok || !res.body) {
        const message = await res.text().catch(() => res.statusText);
        throw new Error(`Ollama request failed: ${res.status} ${message}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                    full += parsed.response;
                }
            } catch (err) {
                console.warn("Failed to parse Ollama chunk:", err);
            }
        }
    }

    return full.trim();
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => ({}))) as { question?: string };
        const question = (body.question ?? "").trim();
        if (!question) {
            return NextResponse.json({ error: "question is required" }, { status: 400 });
        }

        const sensorContext = await buildSensorContext();
        const answer = await generateAnswer(buildPrompt(question, sensorContext));
        if (!answer) {
            return NextResponse.json({ error: "AI did not return a response." }, { status: 502 });
        }

        const [inserted] = await db.insert(aiChat).values({ question, answer }).returning();
        return NextResponse.json(inserted);
    } catch (err) {
        console.error("POST /api/ai-chat failed:", err);
        return NextResponse.json({ error: "Failed to ask AI." }, { status: 500 });
    }
}
