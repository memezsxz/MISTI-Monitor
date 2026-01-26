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

const emptyRange: SensorRange = { min: null, max: null };

function makeEmptyScenario(): ScenarioSensorRanges {
    return {
        flow_1: { ...emptyRange },
        temp_1: { ...emptyRange },
        flow_2: { ...emptyRange },
        temp_2: { ...emptyRange },
        flow_3: { ...emptyRange },
        temp_3: { ...emptyRange },
        flow_4: { ...emptyRange },
        temp_4: { ...emptyRange },
        vfd: { ...emptyRange },
    };
}

const scenarioRanges: ScenarioRangeMap = {
    block: {
        flow_1: { min: 192, max: 1304 },
        temp_1: { min: 21.93, max: 22.37 },
        flow_2: { min: 0, max: 1304 },
        temp_2: { min: 22, max: 22.37 },
        flow_3: { min: 184, max: 1296 },
        temp_3: { min: 22.12, max: 22.68 },
        flow_4: { min: 184, max: 912 },
        temp_4: { min: 22, max: 22.37 },
        vfd: { min: 20, max: 25 },
    },
    leak: {
        flow_1: { min: 168, max: 1904 },
        temp_1: { min: 21.62, max: 22.62 },
        flow_2: { min: 0, max: 192 },
        temp_2: { min: 21.62, max: 22.82 },
        flow_3: { min: 88, max: 808 },
        temp_3: { min: 21.81, max: 22.81 },
        flow_4: { min: 88, max: 808 },
        temp_4: { min: 21.81, max: 22.62 },
        vfd: { min: 20, max: 25 },
    },
    temp: {
        flow_1: { min: 248, max: 1960 },
        temp_1: { min: 49.31, max: 52.81 },
        flow_2: { min: 0, max: 1960 },
        temp_2: { min: 49.31, max: 85 },
        flow_3: { min: 240, max: 1912 },
        temp_3: { min: -127, max: 85 },
        flow_4: { min: 240, max: 1888 },
        temp_4: { min: 49.18, max: 52.43 },
        vfd: { min: 20, max: 30 },
    },
    pumpFail: makeEmptyScenario(),
    normal: {
        flow_1: { min: 248, max: 300 },
        temp_1: { min: 22.12, max: 22.62 },
        flow_2: { min: 0, max: 192 },
        temp_2: { min: 0, max: 22.75 },
        flow_3: { min: 240, max: 256 },
        temp_3: { min: 22.25, max: 22.81 },
        flow_4: { min: 240, max: 256 },
        temp_4: { min: 22.12, max: 22.62 },
        vfd: { min: 20, max: 25 },
    },
};

export function getScenarioSensorRanges(): ScenarioRangeMap {
    return scenarioRanges;
}

export function getRangesForCondition(condition: PumpCondition): ScenarioSensorRanges {
    return scenarioRanges[condition];
}
