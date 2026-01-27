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

const span = (min: number, max: number): SensorRange => ({ min, max });

const scenarioRanges: ScenarioRangeMap = {
    block: {
        flow_1: span(440, 520),
        temp_1: span(24, 26),
        flow_2: span(30, 70),
        temp_2: span(24, 25),
        flow_3: span(300, 360),
        temp_3: span(24, 26),
        flow_4: span(300, 360),
        temp_4: span(24, 25),
        vfd: span(24, 26),
    },
    leak: {
        flow_1: span(200, 230),
        temp_1: span(20, 21.5),
        flow_2: span(4, 10),
        temp_2: span(20, 22),
        flow_3: span(200, 240),
        temp_3: span(20, 22),
        flow_4: span(200, 235),
        temp_4: span(20, 22),
        vfd: span(20, 23),
    },
    temp: {
        flow_1: span(300, 360),
        temp_1: span(37, 46),
        flow_2: span(40, 80),
        temp_2: span(37, 46),
        flow_3: span(300, 360),
        temp_3: span(37, 46),
        flow_4: span(300, 360),
        temp_4: span(37, 46),
        vfd: span(26, 30),
    },
    pumpFail: {
        flow_1: span(200, 250),
        temp_1: span(23.2, 30),
        flow_2: span(20, 50),
        temp_2: span(23, 27),
        flow_3: span(260, 320),
        temp_3: span(23, 27),
        flow_4: span(260, 320),
        temp_4: span(23, 27),
        vfd: span(22, 25),
    },
    normal: {
        flow_1: span(300, 380),
        temp_1: span(23.5, 24.5),
        flow_2: span(15, 30),
        temp_2: span(23, 24.5),
        flow_3: span(300, 340),
        temp_3: span(23, 24.5),
        flow_4: span(300, 340),
        temp_4: span(23, 24.5),
        vfd: span(22, 24),
    },
};

export function getScenarioSensorRanges(): ScenarioRangeMap {
    return scenarioRanges;
}

export function getRangesForCondition(condition: PumpCondition): ScenarioSensorRanges {
    return scenarioRanges[condition];
}
