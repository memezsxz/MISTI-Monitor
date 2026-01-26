import { readFile } from "node:fs/promises";
import path from "node:path";

import { analyzePumpSample, type PumpCondition } from "./aiAnalize";

export type FullSensorSample = {
    flow_1: number;
    temp_1: number;
    flow_2: number;
    temp_2: number;
    flow_3: number;
    temp_3: number;
    flow_4: number;
    temp_4: number;
    vfd: number;
    target: PumpCondition;
};

export type ScenarioPrediction = {
    index: number;
    sensors: FullSensorSample;
    predicted: PumpCondition;
    match: boolean;
};

export type ScenarioSimulation = {
    total: number;
    matches: number;
    accuracy: number;
    breakdown: Record<PumpCondition, { total: number; matches: number; mismatches: number }>;
    predictions: ScenarioPrediction[];
};

const CSV_HEADERS: (keyof FullSensorSample)[] = [
    "flow_1",
    "temp_1",
    "flow_2",
    "temp_2",
    "flow_3",
    "temp_3",
    "flow_4",
    "temp_4",
    "vfd",
    "target",
];

const csvPath = path.resolve(process.cwd(), "combined_data_b.csv");

let cachedSamples: FullSensorSample[] | null = null;

async function loadCombinedSamples(): Promise<FullSensorSample[]> {
    if (cachedSamples) return cachedSamples;

    const raw = await readFile(csvPath, "utf8");
    const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (!lines.length) {
        cachedSamples = [];
        return cachedSamples;
    }

    const [, ...dataLines] = lines; // drop header row
    const samples: FullSensorSample[] = [];

    for (const line of dataLines) {
        const values = line.split(",");
        if (values.length !== CSV_HEADERS.length) continue;

        const sample: Record<string, number | PumpCondition> = {};
        for (let i = 0; i < CSV_HEADERS.length; i++) {
            const key = CSV_HEADERS[i];
            const rawValue = values[i]?.trim();
            if (!rawValue?.length) continue;

            if (key === "target") {
                sample[key] = rawValue as PumpCondition;
            } else {
                const parsed = Number(rawValue);
                if (!Number.isFinite(parsed)) continue;
                sample[key] = parsed;
            }
        }

        if (CSV_HEADERS.every((key) => key in sample)) {
            samples.push(sample as FullSensorSample);
        }
    }

    cachedSamples = samples;
    return samples;
}

function initBreakdown(): ScenarioSimulation["breakdown"] {
    return {
        block: { total: 0, matches: 0, mismatches: 0 },
        leak: { total: 0, matches: 0, mismatches: 0 },
        temp: { total: 0, matches: 0, mismatches: 0 },
        pumpFail: { total: 0, matches: 0, mismatches: 0 },
        normal: { total: 0, matches: 0, mismatches: 0 },
    };
}

export type SimulationOptions = {
    limit?: number;
};

export async function simulatePumpScenarios(options: SimulationOptions = {}): Promise<ScenarioSimulation> {
    const samples = await loadCombinedSamples();
    const subset = typeof options.limit === "number" ? samples.slice(0, options.limit) : samples;

    const predictions: ScenarioPrediction[] = [];
    const breakdown = initBreakdown();
    let matches = 0;

    subset.forEach((sample, index) => {
        const predicted = analyzePumpSample({
            temp_1: sample.temp_1,
            flow_1: sample.flow_1,
            flow_2: sample.flow_2,
            flow_3: sample.flow_3,
            flow_4: sample.flow_4,
        });

        const match = predicted === sample.target;
        if (match) matches += 1;

        const stats = breakdown[sample.target];
        stats.total += 1;
        if (match) stats.matches += 1;
        else stats.mismatches += 1;

        predictions.push({
            index,
            sensors: sample,
            predicted,
            match,
        });
    });

    const total = subset.length;
    const accuracy = total ? matches / total : 0;

    return { total, matches, accuracy, breakdown, predictions };
}
