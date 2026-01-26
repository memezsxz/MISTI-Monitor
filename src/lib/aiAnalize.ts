export type PumpCondition = "block" | "leak" | "temp" | "pumpFail" | "normal";

export type PumpPredictionSample = {
    temp_1: number;
    flow_1: number;
    flow_2: number;
    flow_3: number;
    flow_4: number;
};

function requireReading(value: number, label: keyof PumpPredictionSample): number {
    if (!Number.isFinite(value)) {
        throw new Error(`Reading ${label} is required for AI analysis.`);
    }
    return value;
}

export function analyzePumpSample(sample: PumpPredictionSample): PumpCondition {
    const temp1 = requireReading(sample.temp_1, "temp_1");
    const flow1 = requireReading(sample.flow_1, "flow_1");
    const flow2 = requireReading(sample.flow_2, "flow_2");
    const flow3 = requireReading(sample.flow_3, "flow_3");
    const flow4 = requireReading(sample.flow_4, "flow_4");

    if (temp1 < 36.655) {
        if (flow1 < 268) {
            if (temp1 < 23.15) {
                if (flow4 < 244) {
                    if (flow3 < 252) {
                        if (temp1 < 21.84) {
                            return "leak";
                        }

                        if (flow1 < 260) {
                            if (flow1 < 252) {
                                if (flow2 < 12) {
                                    if (flow1 < 224) {
                                        return "block";
                                    }

                                    return "normal";
                                }

                                return "block";
                            }

                            if (temp1 < 22.185) {
                                return "normal";
                            }

                            return "block";
                        }

                        return "normal";
                    }

                    return "block";
                }

                if (temp1 < 22.215) {
                    return "normal";
                }

                return "block";
            }

            return "pumpFail";
        }

        if (flow3 < 272) {
            return "leak";
        }

        if (flow1 < 432) {
            return "normal";
        }

        return "block";
    }

    return "temp";
}

export function analyzePumpSamples(samples: PumpPredictionSample[]): PumpCondition[] {
    return samples.map(analyzePumpSample);
}
