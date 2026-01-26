import type { PumpCondition } from "./aiAnalize";

export type SensorKey =
    | "flow_1"
    | "temp_1"
    | "flow_2"
    | "temp_2"
    | "flow_3"
    | "temp_3"
    | "flow_4"
    | "temp_4"
    | "vfd";

export type SensorRange = { min: number | null; max: number | null };
export type ScenarioSensorRanges = Record<SensorKey, SensorRange>;

type ScenarioRangeMap = Record<PumpCondition, ScenarioSensorRanges>;

const fixedRange = (value: number): SensorRange => ({ min: value, max: value });

const scenarioRanges: ScenarioRangeMap = {
    block: {
        flow_1: fixedRange(480),
        temp_1: fixedRange(24),
        flow_2: fixedRange(50),
        temp_2: fixedRange(24),
        flow_3: fixedRange(320),
        temp_3: fixedRange(24),
        flow_4: fixedRange(300),
        temp_4: fixedRange(24),
        vfd: fixedRange(23),
    },
    leak: {
        flow_1: fixedRange(320),
        temp_1: fixedRange(22),
        flow_2: fixedRange(20),
        temp_2: fixedRange(22),
        flow_3: fixedRange(260),
        temp_3: fixedRange(22),
        flow_4: fixedRange(220),
        temp_4: fixedRange(22),
        vfd: fixedRange(23),
    },
    temp: {
        flow_1: fixedRange(320),
        temp_1: fixedRange(45),
        flow_2: fixedRange(50),
        temp_2: fixedRange(45),
        flow_3: fixedRange(320),
        temp_3: fixedRange(45),
        flow_4: fixedRange(320),
        temp_4: fixedRange(45),
        vfd: fixedRange(28),
    },
    pumpFail: {
        flow_1: fixedRange(200),
        temp_1: fixedRange(30),
        flow_2: fixedRange(40),
        temp_2: fixedRange(28),
        flow_3: fixedRange(300),
        temp_3: fixedRange(28),
        flow_4: fixedRange(300),
        temp_4: fixedRange(28),
        vfd: fixedRange(24),
    },
    normal: {
        flow_1: fixedRange(320),
        temp_1: fixedRange(24),
        flow_2: fixedRange(40),
        temp_2: fixedRange(24),
        flow_3: fixedRange(300),
        temp_3: fixedRange(24),
        flow_4: fixedRange(300),
        temp_4: fixedRange(24),
        vfd: fixedRange(23),
    },
};

export function getScenarioSensorRanges(): ScenarioRangeMap {
    return scenarioRanges;
}

export function getRangesForCondition(condition: PumpCondition): ScenarioSensorRanges {
    return scenarioRanges[condition];
}
