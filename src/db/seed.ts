import {db} from "./db";
import {
    aiChat,
    NewAiChatRow,
    NewPart,
    NewPartLink,
    NewSensorReading,
    NewUser,
    notifications,
    PartDescription,
    partLinks,
    parts,
    sensorReadings,
    users,
    failureEventLinks,
    failureEvents,
    type NewFailureEventLinkRow,
    type NewFailureEventRow,
} from "./schema";
import {inArray} from "drizzle-orm";
import {turnoverNotes} from "@/db/schema/turnover_notes";
import {NewShift, shifts} from "@/db/schema/shifts";
import {createHash} from "node:crypto";
import {formatLocalDate, formatLocalDateTime} from "@/lib/localDate";

function uuidFromString(input: string): string {
    const hex = createHash("sha1").update(input).digest("hex").slice(0, 32).split("");
    hex[12] = "5";
    hex[16] = "a";
    const h = hex.join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}


async function seed_users() {
    await db.insert(users).values([
        {name: "maryam.ali", password: "Ma123!"},
        {name: "manal.albalushi", password: "Ma123!"},
    ] as NewUser[]);
}

async function seed_notifications() {
    await db.insert(notifications).values([
        {
            level: "low",
            title: "System initialized",
            message: "Fluid loop monitoring started. Sensors online: flow, temperature."
        },
        {
            level: "low",
            title: "Baseline mode active",
            message: "Collecting baseline readings for normal operation profile."
        },
        {
            level: "low",
            title: "Calibration reminder",
            message: "Verify flow sensor zero-offset and temperature probe placement."
        },
        {
            level: "low",
            title: "Maintenance schedule",
            message: "Next routine check: inspect hoses, clamps, and bucket levels."
        },
        {
            level: "low",
            title: "Logging enabled",
            message: "Event logging is active. Storing readings at the configured interval."
        },

        {
            level: "medium",
            title: "Temperature drift detected",
            message: "Hot bucket temperature trending below target range. Check heater and insulation."
        },
        {
            level: "medium",
            title: "Flow instability",
            message: "Flow readings show higher variance than baseline. Check pump speed and inlet conditions."
        },
        {
            level: "medium",
            title: "Possible valve restriction",
            message: "Flow decreased gradually while pump speed stayed constant. Inspect valve position and blockage."
        },

        {
            level: "high",
            title: "Critical flow drop",
            message: "Flow rate fell sharply below safe threshold. Possible blockage, pump issue, or empty supply.",
            acknowledgedAt: formatLocalDateTime(Date.now() - 1000 * 60 * 30),
        },
        {
            level: "high",
            title: "Overtemperature risk",
            message: "Temperature exceeded the configured safe limit. Stop system and verify heating/control components.",
            acknowledgedAt: formatLocalDateTime(Date.now() - 1000 * 60 * 20),
        },
    ]);

}

async function seed_chats() {
    await db.insert(aiChat).values([
        {
            question: "What is the issue if flow suddenly drops below the safe threshold?",
            answer:
                "Here’s what I can help with\n" +
                "- What the issue is (critical flow drop)\n" +
                "- Why it is happening (blockage, cavitation, pump issue, empty supply)\n" +
                "- What sensors are involved (flow sensor + temperature correlation)\n" +
                "- Protocol (stop system → check supply → verify valves → inspect pump/inlet)",
        },
        {
            question: "Why is the hot bucket temperature drifting below the target range?",
            answer:
                "Here’s what I can help with\n" +
                "- What the issue is (temperature drift)\n" +
                "- Why it is happening (heater control, insulation loss, mixing)\n" +
                "- What sensors are involved (temperature + flow)\n" +
                "- Protocol (verify setpoint → check heater → inspect insulation → re-calibrate probe)",
        },
        {
            question: "What sensors are involved when diagnosing cavitation?",
            answer:
                "Here’s what I can help with\n" +
                "- Flow sensor (instability / fluctuating readings)\n" +
                "- Temperature sensor (may drift due to reduced flow / mixing)\n" +
                "- Optional: pump speed / pressure (if available) for confirmation\n" +
                "- Protocol (check inlet restriction → ensure supply level → reduce speed → re-test)",
        },
        {
            question: "Give me a protocol for responding to a suspected valve restriction.",
            answer:
                "Here’s what I can help with\n" +
                "- Confirm symptom (gradual flow decrease while pump speed constant)\n" +
                "- Check valve position and look for partial blockage\n" +
                "- Inspect hoses/clamps for kinks\n" +
                "- Protocol (pause → isolate section → clear restriction → resume and monitor)",
        },
        {
            question: "How do I explain why flow readings have higher variance than baseline?",
            answer:
                "Here’s what I can help with\n" +
                "- What the issue is (flow instability)\n" +
                "- Why it is happening (air bubbles, inlet conditions, pump speed changes, sensor noise)\n" +
                "- What sensors are involved (flow primarily; temperature as supporting context)\n" +
                "- Protocol (stabilize inlet → remove air → verify pump settings → recalibrate sensor)",
        },
    ] as NewAiChatRow[]);
}


async function seed_shifts_notes() {
    // notes & shifts
    const seededUsers = await db
        .select({id: users.id, name: users.name})
        .from(users)
        .where(inArray(users.name, ["maryam.ali", "manal.albalushi"]));

    const maryamId = seededUsers.find((u) => u.name === "maryam.ali")?.id;
    const manalId = seededUsers.find((u) => u.name === "manal.albalushi")?.id;

    if (!maryamId || !manalId) {
        throw new Error("Seed users not found. Check users seed.");
    }

    const now = new Date();
    const today7am = new Date(now);
    today7am.setHours(7, 0, 0, 0);

    const yesterday7pm = new Date(now);
    yesterday7pm.setDate(yesterday7pm.getDate() - 1);
    yesterday7pm.setHours(19, 0, 0, 0);

    const yesterday1159 = new Date(now);
    yesterday1159.setDate(yesterday1159.getDate() - 1);
    yesterday1159.setHours(23, 59, 0, 0);

    const insertedShifts = await db
        .insert(shifts)
        .values([
            {
                userId: maryamId,
                startedAt: formatLocalDateTime(today7am),
                endedAt: null, // active shift
                note: null,
            },
            {
                userId: manalId,
                startedAt: formatLocalDateTime(yesterday7pm),
                endedAt: formatLocalDateTime(yesterday1159), // closed shift
                note: "Handover: heater stable; monitor temperature drift.",
            },
        ] as NewShift[])
        .returning({id: shifts.id, userId: shifts.userId});

    const maryamShiftId = insertedShifts.find((s) => s.userId === maryamId)?.id;
    const manalShiftId = insertedShifts.find((s) => s.userId === manalId)?.id;

    if (!maryamShiftId || !manalShiftId) {
        throw new Error("Shift seed failed (missing shift ids).");
    }

    // 3) Insert turnover notes
    await db.insert(turnoverNotes).values([
        // Maryam (current shift)
        {
            shiftId: maryamShiftId,
            text: "Baseline readings stable after warm-up.",
        },
        {
            shiftId: maryamShiftId,
            text: "Observed minor flow variance when valve is at ~30%. Monitor during next run.",
        },
        {
            shiftId: maryamShiftId,
            text: "Reminder: log flow + temperature every 30s during calibration cycle.",
        },

        // Manal (previous shift)
        {
            shiftId: manalShiftId,
            text: "Temperature drift detected in hot bucket. Insulation checked; heater stable.",
        },
        {
            shiftId: manalShiftId,
            text: "Verify sensor mounting before next calibration cycle.",
        },
    ]);
    // end
}

async function seed_parts()  {
    const pipeLengthsMm: Record<string, number> = {
        pipe_1: 41.3,
        pipe_2: 33.7,
        pipe_3: 84.7,
        pipe_4: 13.0,
        pipe_5: 13.3,
        pipe_6: 227.5,
        pipe_7: 33.7,
        pipe_8: 27.5,
        pipe_9: 13.3,
        pipe_10: 12.8,
        pipe_11: 12.8,
        pipe_12: 38.3,
        pipe_13: 19.9,
        pipe_14: 83.2,
        pipe_15: 20.4,
        pipe_16: 82.6,
        pipe_17: 27.5,
        pipe_18: 33.2,
        pipe_19: 31.6,
        pipe_20: 15.3,
        pipe_21: 14.3,
        pipe_22: 12.8,
        pipe_23: 12.8,
        pipe_24: 30.1,
        pipe_25: 30.1,
        pipe_26: 23.5,
        pipe_27: 23.5,
        pipe_28: 13.3,
        pipe_29: 12.8,
        pipe_30: 14.3,
        pipe_31: 14.3,
        pipe_32: 64.3,
        pipe_33: 31.6,
        pipe_34: 28.1,
        pipe_35: 163.8,
        pipe_36: 32.1,
        pipe_37: 290.3,
        pipe_38: 26.0,
        pipe_39: 296.9,
    };

    const sensorKinds: Record<string, "flow" | "temperature"> = {
        sensor_1: "flow",
        sensor_2: "temperature",
        sensor_3: "flow",
        sensor_4: "temperature",
        sensor_5: "temperature",
        sensor_6: "flow",
        sensor_7: "temperature",
        sensor_8: "flow",
    };

    const baseDate = new Date(2025, 0, 15);
    const dateForIndex = (index: number, offset = 0) => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + ((index + offset) % 6));
        return formatLocalDate(d);
    };

    const describePart = (part: NewPart, index: number): PartDescription => {
        const installDate = dateForIndex(index);
        const maintenanceDue = dateForIndex(index, 3);
        const inspectionDue = dateForIndex(index, 4);
        const lastServiceAt = dateForIndex(index, 1);
        const lastCalibratedAt = dateForIndex(index, 2);
        const calibrationDue = dateForIndex(index, 5);

        switch (part.type) {
            case "pipe":
                return {
                    kind: "pipe",
                    material: "PVC",
                    diameterMm: 25,
                    lengthMm: pipeLengthsMm[part.elementId] ?? 0,
                    maxPressureBar: 4,
                    installDate,
                    inspectionDue,
                };
            case "valve":
                return {
                    kind: "valve",
                    valveType: "ball",
                    sizeMm: 25,
                    normallyOpen: !["valve_6", "valve_8", "valve_10", "valve_11"].includes(part.elementId),
                    Cv: 4,
                    installDate,
                    cycleCount: 0,
                    maintenanceDue,
                };
            case "sensor": {
                const sensorKind = sensorKinds[part.elementId] ?? "flow";
                return {
                    kind: "sensor",
                    sensorType: sensorKind,
                    unit: sensorKind === "flow" ? "L/min" : "°C",
                    range: sensorKind === "flow" ? { min: 0, max: 10 } : { min: 0, max: 100 },
                    accuracyPct: 2,
                    lastCalibratedAt,
                    installDate,
                    calibrationDue,
                };
            }
            case "pump":
                return {
                    kind: "pump",
                    model: "Small circulation pump",
                    rpm: 1450,
                    flowRateLpm: 2.5,
                    headM: 6,
                    powerKw: 0.37,
                    efficiencyPct: 55,
                    installDate,
                    lastServiceAt,
                    maintenanceDue,
                };
            case "tank":
                return {
                    kind: "tank",
                    volumeL: 5,
                    material: "HDPE",
                    maxTempC: 80,
                    levelPct: 50,
                    installDate,
                    inspectionDue,
                };
            case "connector": {
                const connectorType = part.elementId.startsWith("t_") ? "tee" : "elbow";
                return {
                    kind: "connector",
                    connectorType,
                    sizeMm: 25,
                    material: "PVC",
                    installDate,
                };
            }
        }
    };

    const baseParts: NewPart[] = [
        {name: "Pump", type: "pump", elementId: "pump_1"},

        {name: "Tank 1", type: "tank", elementId: "tank_1"},
        {name: "Tank 2", type: "tank", elementId: "tank_2"},

        {name: "Sensor 1", type: "sensor", elementId: "sensor_1"},
        {name: "Sensor 2", type: "sensor", elementId: "sensor_2"},
        {name: "Sensor 3", type: "sensor", elementId: "sensor_3"},
        {name: "Sensor 4", type: "sensor", elementId: "sensor_4"},
        {name: "Sensor 5", type: "sensor", elementId: "sensor_5"},
        {name: "Sensor 6", type: "sensor", elementId: "sensor_6"},
        {name: "Sensor 7", type: "sensor", elementId: "sensor_7"},
        {name: "Sensor 8", type: "sensor", elementId: "sensor_8"},

        {name: "Valve 1", type: "valve", elementId: "valve_1"},
        {name: "Valve 2", type: "valve", elementId: "valve_2"},
        {name: "Valve 3", type: "valve", elementId: "valve_3"},
        {name: "Valve 4", type: "valve", elementId: "valve_4"},
        {name: "Valve 5", type: "valve", elementId: "valve_5"},
        {name: "Valve 6", type: "valve", elementId: "valve_6"},
        {name: "Valve 7", type: "valve", elementId: "valve_7"},
        {name: "Valve 8", type: "valve", elementId: "valve_8"},
        {name: "Valve 9", type: "valve", elementId: "valve_9"},
        {name: "Valve 10", type: "valve", elementId: "valve_10"},
        {name: "Valve 11", type: "valve", elementId: "valve_11"},

        {name: "Connector L1", type: "connector", elementId: "l_1"},
        {name: "Connector L3", type: "connector", elementId: "l_3"},
        {name: "Connector L6", type: "connector", elementId: "l_6"},
        {name: "Connector L8", type: "connector", elementId: "l_8"},
        {name: "Connector L9", type: "connector", elementId: "l_9"},
        {name: "Connector L10", type: "connector", elementId: "l_10"},
        {name: "Connector L11", type: "connector", elementId: "l_11"},
        {name: "Connector L13", type: "connector", elementId: "l_13"},

        {name: "Connector T1", type: "connector", elementId: "t_1"},
        {name: "Connector T4", type: "connector", elementId: "t_4"},
        {name: "Connector T5", type: "connector", elementId: "t_5"},
        {name: "Connector T7", type: "connector", elementId: "t_7"},
        {name: "Connector T12", type: "connector", elementId: "t_12"},
        {name: "Connector T14", type: "connector", elementId: "t_14"},

        {name: "Pipe 1", type: "pipe", elementId: "pipe_1"},
        {name: "Pipe 2", type: "pipe", elementId: "pipe_2"},
        {name: "Pipe 3", type: "pipe", elementId: "pipe_3"},
        {name: "Pipe 4", type: "pipe", elementId: "pipe_4"},
        {name: "Pipe 5", type: "pipe", elementId: "pipe_5"},
        {name: "Pipe 6", type: "pipe", elementId: "pipe_6"},
        {name: "Pipe 7", type: "pipe", elementId: "pipe_7"},
        {name: "Pipe 8", type: "pipe", elementId: "pipe_8"},
        {name: "Pipe 9", type: "pipe", elementId: "pipe_9"},
        {name: "Pipe 10", type: "pipe", elementId: "pipe_10"},
        {name: "Pipe 11", type: "pipe", elementId: "pipe_11"},
        {name: "Pipe 12", type: "pipe", elementId: "pipe_12"},
        {name: "Pipe 13", type: "pipe", elementId: "pipe_13"},
        {name: "Pipe 14", type: "pipe", elementId: "pipe_14"},
        {name: "Pipe 15", type: "pipe", elementId: "pipe_15"},
        {name: "Pipe 16", type: "pipe", elementId: "pipe_16"},
        {name: "Pipe 17", type: "pipe", elementId: "pipe_17"},
        {name: "Pipe 18", type: "pipe", elementId: "pipe_18"},
        {name: "Pipe 19", type: "pipe", elementId: "pipe_19"},
        {name: "Pipe 20", type: "pipe", elementId: "pipe_20"},
        {name: "Pipe 21", type: "pipe", elementId: "pipe_21"},
        {name: "Pipe 22", type: "pipe", elementId: "pipe_22"},
        {name: "Pipe 23", type: "pipe", elementId: "pipe_23"},
        {name: "Pipe 24", type: "pipe", elementId: "pipe_24"},
        {name: "Pipe 25", type: "pipe", elementId: "pipe_25"},
        {name: "Pipe 26", type: "pipe", elementId: "pipe_26"},
        {name: "Pipe 27", type: "pipe", elementId: "pipe_27"},
        {name: "Pipe 28", type: "pipe", elementId: "pipe_28"},
        {name: "Pipe 29", type: "pipe", elementId: "pipe_29"},
        {name: "Pipe 30", type: "pipe", elementId: "pipe_30"},
        {name: "Pipe 31", type: "pipe", elementId: "pipe_31"},
        {name: "Pipe 32", type: "pipe", elementId: "pipe_32"},
        {name: "Pipe 33", type: "pipe", elementId: "pipe_33"},
        {name: "Pipe 34", type: "pipe", elementId: "pipe_34"},
        {name: "Pipe 35", type: "pipe", elementId: "pipe_35"},
        {name: "Pipe 36", type: "pipe", elementId: "pipe_36"},
        {name: "Pipe 37", type: "pipe", elementId: "pipe_37"},
        {name: "Pipe 38", type: "pipe", elementId: "pipe_38"},
        {name: "Pipe 39", type: "pipe", elementId: "pipe_39"},
    ];

    const partsToInsert = baseParts.map((part, index) => ({
        ...part,
        description: describePart(part, index),
    }));

    await db.insert(parts).values(partsToInsert as NewPart[]);

}

async function seed_part_links() {
    const directedLinks: Array<{from: string; to: string}> = [];
    const addDirected = (from: string, to: string) => directedLinks.push({from, to});

    // Directed closed loop (only t_* have multi in/out)
    addDirected("pipe_19", "t_7");
    addDirected("t_7", "pipe_20");
    addDirected("t_7", "pipe_21");
    addDirected("pipe_30", "t_12");
    addDirected("pipe_31", "t_12");
    addDirected("t_12", "pipe_32");
    addDirected("pipe_34", "t_14");
    addDirected("pipe_39", "t_14");
    addDirected("t_14", "pipe_35");
    addDirected("pipe_28", "l_10");
    addDirected("l_10", "pipe_30");
    addDirected("pipe_29", "l_11");
    addDirected("l_11", "pipe_31");
    addDirected("l_13", "pipe_33");
    addDirected("pipe_32", "l_13");
    addDirected("l_3", "pipe_9");
    addDirected("pipe_8", "l_3");
    addDirected("pipe_18", "l_6");
    addDirected("l_6", "pipe_19");
    addDirected("pipe_5", "l_1");
    addDirected("l_1", "pipe_6");
    addDirected("pipe_20", "l_8");
    addDirected("l_8", "pipe_22");
    addDirected("pipe_21", "l_9");
    addDirected("l_9", "pipe_23");
    addDirected("pump_1", "pipe_1");
    addDirected("pipe_35", "pump_1");
    addDirected("pipe_1", "sensor_1");
    addDirected("sensor_1", "pipe_2");
    addDirected("pipe_2", "sensor_2");
    addDirected("sensor_2", "pipe_3");
    addDirected("pipe_6", "sensor_3");
    addDirected("sensor_3", "pipe_7");
    addDirected("pipe_7", "sensor_4");
    addDirected("sensor_4", "pipe_8");
    addDirected("pipe_12", "sensor_5");
    addDirected("sensor_5", "pipe_13");
    addDirected("pipe_13", "sensor_6");
    addDirected("sensor_6", "pipe_14");
    addDirected("pipe_14", "sensor_7");
    addDirected("sensor_7", "pipe_15");
    addDirected("pipe_15", "sensor_8");
    addDirected("sensor_8", "pipe_16");
    addDirected("pipe_24", "tank_1");
    addDirected("tank_1", "pipe_26");
    addDirected("pipe_25", "tank_2");
    addDirected("tank_2", "pipe_27");
    addDirected("pipe_3", "t_1");
    addDirected("t_1", "pipe_4");
    addDirected("t_1", "pipe_36");
    addDirected("pipe_10", "t_4");
    addDirected("t_4", "pipe_11");
    addDirected("pipe_37", "t_4");
    addDirected("pipe_16", "t_5");
    addDirected("t_5", "pipe_17");
    addDirected("t_5", "pipe_38");
    addDirected("pipe_4", "valve_1");
    addDirected("valve_1", "pipe_5");
    addDirected("pipe_9", "valve_2");
    addDirected("valve_2", "pipe_10");
    addDirected("pipe_11", "valve_3");
    addDirected("valve_3", "pipe_12");
    addDirected("pipe_17", "valve_4");
    addDirected("valve_4", "pipe_18");
    addDirected("pipe_22", "valve_5");
    addDirected("valve_5", "pipe_24");
    addDirected("pipe_23", "valve_6");
    addDirected("valve_6", "pipe_25");
    addDirected("pipe_26", "valve_7");
    addDirected("valve_7", "pipe_28");
    addDirected("pipe_27", "valve_8");
    addDirected("valve_8", "pipe_29");
    addDirected("pipe_33", "valve_9");
    addDirected("valve_9", "pipe_34");
    addDirected("pipe_36", "valve_10");
    addDirected("valve_10", "pipe_37");
    addDirected("pipe_38", "valve_11");
    addDirected("valve_11", "pipe_39");

    const uniqueLinks = new Map<string, {from: string; to: string}>();
    for (const link of directedLinks) {
        uniqueLinks.set(`${link.from}->${link.to}`, link);
    }

    const elementIds = Array.from(
        new Set(Array.from(uniqueLinks.values()).flatMap((link) => [link.from, link.to])),
    );

    const rows = await db
        .select({id: parts.id, elementId: parts.elementId})
        .from(parts)
        .where(inArray(parts.elementId, elementIds));

    const idByElement = new Map(rows.map((row) => [row.elementId, row.id]));

    const linkRows: NewPartLink[] = Array.from(uniqueLinks.values()).map((link) => {
        const fromId = idByElement.get(link.from);
        const toId = idByElement.get(link.to);
        if (fromId == null || toId == null) {
            throw new Error(`Missing part for link ${link.from} -> ${link.to}`);
        }
        return {
            id: uuidFromString(`part_link:${link.from}->${link.to}`),
            fromPartId: String(fromId),
            toPartId: String(toId),
        };
    });

    await db.insert(partLinks).values(linkRows);
}

async function seed_sensor_readings() {
    const sensorElementIds = [
        "sensor_1",
        "sensor_2",
        "sensor_3",
        "sensor_4",
        "sensor_5",
        "sensor_6",
        "sensor_7",
        "sensor_8",
    ];

    const rows = await db
        .select({id: parts.id, elementId: parts.elementId})
        .from(parts)
        .where(inArray(parts.elementId, sensorElementIds));

    const idByElement = new Map(rows.map((row) => [row.elementId, row.id]));

    const now = new Date();
    const timestamps = [
        new Date(now.getTime() - 2 * 60 * 1000),
        new Date(now.getTime() - 60 * 1000),
        new Date(now.getTime()),
    ];

    const baseValues: Record<string, number> = {
        sensor_1: 320,
        sensor_2: 30,
        sensor_3: 300,
        sensor_4: 310,
        sensor_5: 32,
        sensor_6: 320,
        sensor_7: 31,
        sensor_8: 305,
    };

    const readings: NewSensorReading[] = [];
    for (const sensorId of sensorElementIds) {
        const partId = idByElement.get(sensorId);
        if (partId == null) {
            throw new Error(`Missing part for sensor ${sensorId}`);
        }
        const base = baseValues[sensorId] ?? 0;
        timestamps.forEach((ts, idx) => {
            readings.push({
                id: uuidFromString(`sensor_reading:${sensorId}:${idx}`),
                sensorPartId: String(partId),
                ts: formatLocalDateTime(ts),
                value: base + idx * 0.1,
            });
        });
    }

    await db.insert(sensorReadings).values(readings);
}


// seed_failure_tree_clip1.ts (or paste into seed.ts)
// Assumes uuidFromString(input: string) already exists (it does in your seed.ts)

function feId(key: string) {
    return uuidFromString(`failure_event:${key}`);
}

function felId(fromKey: string, toKey: string) {
    return uuidFromString(`failure_event_link:${fromKey}->${toKey}`);
}

export async function seed_failure_tree() {
    // ---- Events (clip #1) ----
    const events1: NewFailureEventRow[] = [
        // main
        {
            id: feId("temp_above_normal_conditions"),
            name: "Temperature Above Normal Conditions",
            kind: "intermediate",
            description:
                "System temperature exceeds the expected normal operating range; typically indicates heating control issues or reduced cooling effectiveness.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                signal: "temperature",
                threshold: "above_normal",
                note: "Intermediate (derived from child events).",
            }),
            tags: JSON.stringify(["temperature", "abnormal", "fluid-loop", "intermediate"]),
        },

        // gate under main
        {
            id: feId("gate_or_temp_above_normal_conditions"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Temperature Above Normal Conditions occurs if any one of the child causes occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "OR",
                parent: "temp_above_normal_conditions",
            }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // children of main gate
        {
            id: feId("cooling_reservoir_blocked"),
            name: "Cooling Reservoir Blocked",
            kind: "intermediate",
            description:
                "Cooling reservoir circulation is restricted or blocked, reducing heat removal and increasing system temperature.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "cooling_reservoir",
                failure: "blockage",
                note: "Intermediate (derived from leaf events).",
            }),
            tags: JSON.stringify(["cooling", "blockage", "intermediate"]),
        },
        {
            id: feId("cooling_reservoir_leakage"),
            name: "Cooling Reservoir Leakage",
            kind: "basic",
            description:
                "Loss of coolant/volume from the cooling reservoir due to leakage, reducing cooling capacity.",
            probability: 0.03,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "cooling_reservoir",
                failure: "leakage",
                detection_hint: "Monitor level/visual inspection; correlate with temperature rise.",
            }),
            tags: JSON.stringify(["cooling", "leak", "basic"]),
        },
        {
            id: feId("recirculation_of_alternate_route"),
            name: "Recirculation of Alternate Route",
            kind: "intermediate",
            description:
                "Unintended recirculation through an alternate route (e.g., via both bucket paths), potentially increasing temperature due to poor heat rejection or mixing.",
            probability: null,
            severity: "medium",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "routing",
                note: "Intermediate driven by simultaneous bucket leaks (AND).",
            }),
            tags: JSON.stringify(["routing", "recirculation", "intermediate"]),
        },
        {
            id: feId("heater_kept_on"),
            name: "Heater Kept On",
            kind: "basic",
            description:
                "Heater remains on when it should be off (control fault or operator oversight), elevating system temperature.",
            probability: 0.02,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "heater",
                failure: "stuck_on",
                detection_hint: "Compare heater state vs setpoint; confirm relay/control signal.",
            }),
            tags: JSON.stringify(["heater", "control", "basic"]),
        },

        // gate under Cooling Reservoir Blocked
        {
            id: feId("gate_or_cooling_reservoir_blocked"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Cooling Reservoir Blocked occurs if any one of the child blockage contributors occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "OR",
                parent: "cooling_reservoir_blocked",
            }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // leaves under Cooling Reservoir Blocked
        {
            id: feId("valves_close"),
            name: "Valves Close",
            kind: "basic",
            description:
                "Valve(s) are closed or partially closed, restricting flow and reducing cooling circulation.",
            probability: 0.05,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                component: "valve",
                failure: "closed",
                detection_hint: "Check valve position indicators; correlate with flow drop.",
            }),
            tags: JSON.stringify(["valve", "restriction", "basic"]),
        },
        {
            id: feId("contamination"),
            name: "Contamination",
            kind: "basic",
            description:
                "Debris/particles in the circuit cause restriction or fouling, reducing cooling effectiveness and potentially blocking passages.",
            probability: 0.04,
            severity: "high",
            detection: "low",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                failure: "contamination",
                detection_hint: "Hard to detect directly; infer from recurring restrictions / inspection.",
            }),
            tags: JSON.stringify(["contamination", "fouling", "basic"]),
        },

        // gate under Recirculation of Alternate Route
        {
            id: feId("gate_and_recirculation_of_alternate_route"),
            name: "AND Gate",
            kind: "gate_and",
            description:
                "AND logic: Recirculation of Alternate Route occurs only when all required conditions occur together (both bucket leaks).",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "AND",
                parent: "recirculation_of_alternate_route",
            }),
            tags: JSON.stringify(["gate", "and"]),
        },

        // leaves under Recirculation of Alternate Route
        {
            id: feId("bucket_1_leak"),
            name: "Bucket 1 leak",
            kind: "basic",
            description:
                "Leak in bucket 1 path causes unintended flow behavior or reduced system stability (level drop / air ingress).",
            probability: 0.03,
            severity: "medium",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "bucket_1",
                failure: "leak",
                detection_hint: "Visual inspection; level trend; correlate with flow instability.",
            }),
            tags: JSON.stringify(["bucket", "leak", "basic"]),
        },
        {
            id: feId("bucket_2_leak"),
            name: "Bucket 2 leak",
            kind: "basic",
            description:
                "Leak in bucket 2 path causes unintended flow behavior or reduced system stability (level drop / air ingress).",
            probability: 0.03,
            severity: "medium",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "bucket_2",
                failure: "leak",
                detection_hint: "Visual inspection; level trend; correlate with flow instability.",
            }),
            tags: JSON.stringify(["bucket", "leak", "basic"]),
        },
    ];


    // ---- Events (clip #2) ----
    const events2: NewFailureEventRow[] = [
        // main
        {
            id: feId("temp_under_normal_conditions"),
            name: "Temperature Under Normal Conditions",
            kind: "intermediate",
            description:
                "System temperature falls below the defined normal operating range; typically indicates excessive cooling or insufficient heating.",
            probability: null,
            severity: "medium",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                signal: "temperature",
                threshold: "under_normal",
                note: "Intermediate (derived from child events).",
            }),
            tags: JSON.stringify(["temperature", "below-normal", "abnormal", "intermediate"]),
        },

        // gate under main
        {
            id: feId("gate_or_temp_under_normal_conditions"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Temperature Under Normal Conditions occurs if any one of the child causes occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "OR",
                parent: "temp_under_normal_conditions",
            }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // children
        {
            id: feId("excessive_cooling_duration"),
            name: "Excessive Cooling Duration",
            kind: "intermediate",
            description:
                "Cooling is applied for longer than designed/required, resulting in temperature dropping below normal range.",
            probability: null,
            severity: "medium",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "cooling",
                failure: "excessive_duration",
                note: "Intermediate driven by operator error or hot reservoir leakage.",
            }),
            tags: JSON.stringify(["cooling", "duration", "intermediate"]),
        },
        {
            id: feId("heater_kept_off"),
            name: "Heater kept off",
            kind: "intermediate",
            description:
                "Heater is not enabled when heating is needed (e.g., control decision or operator action), allowing temperature to fall below normal.",
            probability: null,
            severity: "medium",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "heater",
                failure: "kept_off",
                note: "Intermediate driven by operator error or heater malfunction.",
            }),
            tags: JSON.stringify(["heater", "off", "intermediate"]),
        },

        // gate under Excessive Cooling Duration
        {
            id: feId("gate_or_excessive_cooling_duration"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Excessive Cooling Duration occurs if operator error happens or if hot reservoir leakage contributes to prolonged/ineffective thermal control.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "OR",
                parent: "excessive_cooling_duration",
            }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // leaves (shared operator error)
        {
            id: feId("operator_error"),
            name: "Operator Error",
            kind: "basic",
            description:
                "Incorrect human action (wrong setting, delayed response, or incorrect valve/heater/cooling operation) leading to undesired temperature behavior.",
            probability: 0.06,
            severity: "medium",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "human_factor",
                failure: "operator_error",
                detection_hint: "Validate procedures, logging, and operator actions vs expected sequence.",
                note: "Shared leaf used in multiple branches.",
            }),
            tags: JSON.stringify(["operator", "human-factor", "basic", "shared"]),
        },
        {
            id: feId("leakage_in_hot_reservoir"),
            name: "Leakage in Hot Reservoir",
            kind: "basic",
            description:
                "Leak in the hot reservoir reduces heating capacity/available hot fluid, contributing to lower system temperature.",
            probability: 0.03,
            severity: "medium",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "hot_reservoir",
                failure: "leakage",
                detection_hint: "Monitor level/visual inspection; correlate with inability to maintain temperature.",
            }),
            tags: JSON.stringify(["hot-reservoir", "leak", "basic"]),
        },

        // gate under Heater kept off
        {
            id: feId("gate_or_heater_kept_off"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Heater kept off occurs due to operator error or heater malfunction preventing heating.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "OR",
                parent: "heater_kept_off",
            }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // leaves
        {
            id: feId("heater_malfunction"),
            name: "Heater Malfunction",
            kind: "basic",
            description:
                "Heater fails to operate correctly (no heat output, control fault, relay failure), resulting in insufficient heating and low temperature.",
            probability: 0.02,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "heater",
                failure: "malfunction",
                detection_hint: "Compare heater command vs measured temperature response; check power/relay state.",
            }),
            tags: JSON.stringify(["heater", "failure", "basic"]),
        },
    ];

    // ---- Events (clip #3) ----
    const events3: NewFailureEventRow[] = [
        // root
        {
            id: feId("high_flow"),
            name: "High Flow",
            kind: "intermediate",
            description:
                "Flow rate exceeds the defined normal operating range; may indicate pump overspeed/overdrive or abnormal restrictions/routing effects that force high flow in the measured segment.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                signal: "flow",
                threshold: "above_normal",
                note: "Intermediate (derived from child events).",
            }),
            tags: JSON.stringify(["flow", "above-normal", "abnormal", "intermediate"]),
        },

        // gate under High Flow
        {
            id: feId("gate_or_high_flow"),
            name: "OR Gate",
            kind: "gate_or",
            description: "OR logic: High Flow occurs if any one of the child causes occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "high_flow" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // branch: Pump Operating Above Normal Conditions
        {
            id: feId("pump_operating_above_normal_conditions"),
            name: "Pump Operating Above Normal Conditions",
            kind: "intermediate",
            description:
                "Pump operates above its intended setting (speed/command), increasing delivered flow beyond normal.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "pump",
                failure: "over_operation",
                note: "Intermediate driven by operator error or control/system error.",
            }),
            tags: JSON.stringify(["pump", "overdrive", "flow", "intermediate"]),
        },
        {
            id: feId("gate_or_pump_operating_above_normal_conditions"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Pump Operating Above Normal Conditions occurs due to operator error or system/control error.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "OR",
                parent: "pump_operating_above_normal_conditions",
            }),
            tags: JSON.stringify(["gate", "or"]),
        },
        {
            id: feId("system_error"),
            name: "System Error",
            kind: "basic",
            description:
                "Control/software/hardware fault causes an incorrect pump command (e.g., wrong setpoint, bad feedback loop, or controller bug) leading to over-operation.",
            probability: 0.02,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "control_system",
                component: "controller",
                failure: "system_error",
                detection_hint: "Compare commanded vs expected pump state; review logs/alerts.",
            }),
            tags: JSON.stringify(["control", "system-error", "pump", "basic"]),
        },

        // branch: Blockage Before GP
        {
            id: feId("blockage_before_gp"),
            name: "Blockage Before GP",
            kind: "intermediate",
            description:
                "Restriction/blockage upstream of GP (gauge point) alters flow distribution and can contribute to abnormal measured flow conditions.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                location: "before_gp",
                failure: "blockage",
                note: "Intermediate; diagram shows AND junction at this level.",
            }),
            tags: JSON.stringify(["blockage", "upstream", "gp", "intermediate"]),
        },
        {
            id: feId("gate_and_blockage_before_gp"),
            name: "AND Gate",
            kind: "gate_and",
            description:
                "AND logic: Blockage Before GP requires combined conditions per the diagram (both route-related blockage contributors must be present).",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "AND",
                parent: "blockage_before_gp",
                note: "Use dome-shaped gate in diagram.",
            }),
            tags: JSON.stringify(["gate", "and"]),
        },

        {
            id: feId("blockage_in_original_route"),
            name: "Blockage in original route",
            kind: "intermediate",
            description:
                "Restriction in the primary/original flow path (e.g., closed valve or contamination) reduces or redirects flow.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                routing: "original_route",
                failure: "blockage",
                note: "Intermediate (driven by valves close and/or contamination).",
            }),
            tags: JSON.stringify(["blockage", "original-route", "intermediate"]),
        },
        {
            id: feId("gate_or_blockage_in_original_route"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Blockage in original route occurs if valves are closed or contamination causes restriction.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "blockage_in_original_route" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        {
            id: feId("blockage_in_alternative_route"),
            name: "Blockage in Alternative Route",
            kind: "intermediate",
            description:
                "Restriction in the alternative route reduces bypass/redirected flow capability; may cause abnormal distribution and contribute to high measured flow elsewhere.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                routing: "alternative_route",
                failure: "blockage",
                note: "Intermediate (driven by operator error / valves close / contamination in your diagram).",
            }),
            tags: JSON.stringify(["blockage", "alternative-route", "intermediate"]),
        },
        {
            id: feId("gate_or_blockage_in_alternative_route"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Blockage in Alternative Route occurs if operator error happens, valves close, or contamination causes restriction.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "blockage_in_alternative_route" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // branch: Blockage After GP
        {
            id: feId("blockage_after_gp"),
            name: "Blockage After GP",
            kind: "intermediate",
            description:
                "Restriction downstream of GP changes flow/pressure characteristics and may lead to abnormal flow readings or rerouting effects.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                location: "after_gp",
                failure: "blockage",
                note: "Intermediate; includes contamination and a valve-closure AND junction.",
            }),
            tags: JSON.stringify(["blockage", "downstream", "gp", "intermediate"]),
        },
        {
            id: feId("gate_or_blockage_after_gp"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Blockage After GP occurs due to contamination or due to the combined valve-closure condition (AND gate branch).",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "blockage_after_gp" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // valve-branch gate under Blockage After GP
        {
            id: feId("gate_and_blockage_after_gp_valves"),
            name: "AND Gate",
            kind: "gate_and",
            description:
                "AND logic: downstream valve-related blockage condition requires all listed valves to be closed (per diagram).",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "AND",
                parent: "blockage_after_gp",
                branch: "valves",
                note: "Use dome-shaped gate in diagram.",
            }),
            tags: JSON.stringify(["gate", "and", "valves"]),
        },
        {
            id: feId("valve_1_closed"),
            name: "Valve 1 closed",
            kind: "basic",
            description:
                "Valve 1 is closed or significantly restricted, contributing to downstream blockage and altered flow conditions.",
            probability: 0.04,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                component: "valve",
                valve: 1,
                failure: "closed",
                detection_hint: "Check valve position/indicator; correlate with flow/pressure change.",
            }),
            tags: JSON.stringify(["valve", "closed", "basic", "valve-1"]),
        },
        {
            id: feId("valve_2_closed"),
            name: "Valve 2 closed",
            kind: "basic",
            description:
                "Valve 2 is closed or significantly restricted, contributing to downstream blockage and altered flow conditions.",
            probability: 0.04,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                component: "valve",
                valve: 2,
                failure: "closed",
                detection_hint: "Check valve position/indicator; correlate with flow/pressure change.",
            }),
            tags: JSON.stringify(["valve", "closed", "basic", "valve-2"]),
        },
        {
            id: feId("valve_3_closed"),
            name: "Valve 3 closed",
            kind: "basic",
            description:
                "Valve 3 is closed or significantly restricted, contributing to downstream blockage and altered flow conditions.",
            probability: 0.04,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                component: "valve",
                valve: 3,
                failure: "closed",
                detection_hint: "Check valve position/indicator; correlate with flow/pressure change.",
            }),
            tags: JSON.stringify(["valve", "closed", "basic", "valve-3"]),
        },
    ];

    const events4: NewFailureEventRow[] = [
        // Leaks branch
        {
            id: feId("leaks"),
            name: "Leaks",
            kind: "intermediate",
            description:
                "Unintended fluid loss from the system due to cracks, loose fittings, or seal failures; can reduce performance and cause instability.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                failure: "leakage",
                note: "Intermediate (derived from child leak sources).",
            }),
            tags: JSON.stringify(["leak", "fluid-loss", "intermediate"]),
        },
        {
            id: feId("gate_or_leaks"),
            name: "OR Gate",
            kind: "gate_or",
            description: "OR logic: Leaks occur if any one of the listed leak sources occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "leaks" }),
            tags: JSON.stringify(["gate", "or"]),
        },
        {
            id: feId("pipe_crack"),
            name: "Pipe Crack",
            kind: "basic",
            description:
                "Crack in a pipe/line causes leakage and possible air ingress, reducing effective flow and system stability.",
            probability: 0.03,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                component: "pipe",
                failure: "crack",
                detection_hint: "Visual inspection; wet spots; pressure decay; recurring air bubbles.",
            }),
            tags: JSON.stringify(["pipe", "crack", "leak", "basic"]),
        },
        {
            id: feId("loose_fittings"),
            name: "Loose Fittings",
            kind: "basic",
            description:
                "Loose couplings/fittings allow leakage at joints, especially under pressure or vibration.",
            probability: 0.04,
            severity: "medium",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                component: "fitting",
                failure: "loose_connection",
                detection_hint: "Visual inspection; tightening check; leak around joints.",
            }),
            tags: JSON.stringify(["fittings", "loose", "leak", "basic"]),
        },

        // Broken pump branch
        {
            id: feId("broken_pump"),
            name: "Broken pump",
            kind: "intermediate",
            description:
                "Pump fails to deliver expected performance due to mechanical, electrical, fluid compatibility, or seal issues.",
            probability: null,
            severity: "critical",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "pump",
                failure: "pump_failure",
                note: "Intermediate: can be driven by wrong fluid, electrical issues, seal leak, contamination, cavitation, or unknown malfunction.",
            }),
            tags: JSON.stringify(["pump", "failure", "intermediate"]),
        },
        {
            id: feId("gate_or_broken_pump"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Broken pump occurs if any one of the listed contributing faults occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "broken_pump" }),
            tags: JSON.stringify(["gate", "or"]),
        },
        {
            id: feId("wrong_fluid"),
            name: "Wrong fluid",
            kind: "basic",
            description:
                "Incorrect fluid type/mixture (viscosity, contamination, or incompatible chemistry) causes poor pump operation or damage.",
            probability: 0.02,
            severity: "high",
            detection: "low",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "pump",
                failure: "wrong_fluid",
                detection_hint: "Hard to detect immediately; validate fluid spec; observe abnormal noise/temperature/flow.",
            }),
            tags: JSON.stringify(["fluid", "wrong-fluid", "pump", "basic"]),
        },
        {
            id: feId("electrical_problems"),
            name: "Electrical Problems",
            kind: "intermediate",
            description:
                "Electrical supply/control issues prevent the pump from running reliably or at correct power.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "electrical",
                subsystem: "pump",
                failure: "electrical_issue",
                note: "Intermediate driven by operator error or power outage (per your diagram).",
            }),
            tags: JSON.stringify(["electrical", "pump", "intermediate"]),
        },
        {
            id: feId("gate_or_electrical_problems"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Electrical Problems occur due to operator error (miswiring/incorrect setup) or power outage.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "electrical_problems" }),
            tags: JSON.stringify(["gate", "or"]),
        },
        {
            id: feId("power_outage"),
            name: "Power Outage",
            kind: "basic",
            description:
                "Loss of electrical power prevents pump operation and may cause abrupt flow drop or unstable behavior on restart.",
            probability: 0.02,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "electrical",
                component: "power_supply",
                failure: "outage",
                detection_hint: "Power indicator off; controller reset; logs show loss-of-power event.",
            }),
            tags: JSON.stringify(["power", "outage", "basic"]),
        },
        {
            id: feId("pump_seal_leak"),
            name: "pump seal leak",
            kind: "basic",
            description:
                "Seal failure at the pump shaft/connection causes leakage and may allow air ingress, reducing pump efficiency or causing damage.",
            probability: 0.03,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                component: "pump_seal",
                failure: "seal_leak",
                detection_hint: "Leak near pump; wet housing; reduced performance; possible cavitation-like symptoms.",
            }),
            tags: JSON.stringify(["pump", "seal", "leak", "basic"]),
        },
        {
            id: feId("unknown_malfunction"),
            name: "unknown malfunction",
            kind: "basic",
            description:
                "Unidentified fault causing abnormal pump behavior when no specific failure mode is confirmed.",
            probability: 0.01,
            severity: "medium",
            detection: "low",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "pump",
                failure: "unknown",
                detection_hint: "Use as placeholder until root-cause is confirmed; log symptoms and diagnostics.",
            }),
            tags: JSON.stringify(["unknown", "malfunction", "basic"]),
        },

        // Cavitation branch (spelled "Cavatation" in the image)
        {
            id: feId("cavitation"),
            name: "Cavatation",
            kind: "intermediate",
            description:
                "Cavitation occurs when local pressure drops below vapor pressure, causing vapor bubbles and potential pump damage, noise, and reduced flow.",
            probability: null,
            severity: "critical",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "pump",
                failure: "cavitation",
                note: "Intermediate driven by operator error, blockage before pump, bucket leaks, or alternate-route circulation above designed time.",
            }),
            tags: JSON.stringify(["cavitation", "pump", "intermediate"]),
        },
        {
            id: feId("gate_or_cavitation"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Cavitation occurs if any one of the listed contributing conditions occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "cavitation" }),
            tags: JSON.stringify(["gate", "or"]),
        },
        {
            id: feId("blockage_before_pump"),
            name: "Blockage Before pump",
            kind: "intermediate",
            description:
                "Restriction on the suction side of the pump reduces inlet pressure, increasing the likelihood of cavitation.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                location: "before_pump",
                failure: "blockage",
                note: "Intermediate suction-side restriction condition.",
            }),
            tags: JSON.stringify(["blockage", "suction", "pump", "intermediate"]),
        },
        {
            id: feId("bucket_leaks"),
            name: "Bucket leaks",
            kind: "intermediate",
            description:
                "Leakage from one or both buckets reduces available volume and can introduce air, contributing to cavitation and unstable pump inlet conditions.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "buckets",
                failure: "leakage",
                note: "Intermediate bucket leakage condition (children are Bucket 1 leak + Bucket 2 leak elsewhere).",
            }),
            tags: JSON.stringify(["bucket", "leak", "intermediate"]),
        },
        {
            id: feId("alt_route_circulation_above_designed_time"),
            name: "Alternative Route Circulation Above Designed Time",
            kind: "intermediate",
            description:
                "Fluid circulates through an alternate route for longer than designed, potentially reducing inlet pressure and contributing to cavitation.",
            probability: null,
            severity: "high",
            detection: "low",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "routing",
                failure: "alt_route_over_duration",
                note: "Intermediate driven by a required combination (AND) of bucket leak conditions (per diagram).",
            }),
            tags: JSON.stringify(["routing", "alternate-route", "duration", "intermediate"]),
        },
        {
            id: feId("gate_and_alt_route_circulation_above_designed_time"),
            name: "AND Gate",
            kind: "gate_and",
            description:
                "AND logic: Alternative Route Circulation Above Designed Time occurs only when all required input conditions occur together (per diagram).",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "AND",
                parent: "alt_route_circulation_above_designed_time",
                note: "Use dome-shaped gate in diagram.",
            }),
            tags: JSON.stringify(["gate", "and"]),
        },
    ];

    const events5: NewFailureEventRow[] = [
        {
            id: feId("pump_under_performing"),
            name: "Pump under-performing",
            kind: "intermediate",
            description:
                "Pump delivers lower-than-expected flow/pressure compared to its normal operating range; can be caused by mechanical wear, cavitation, incorrect settings, or electrical/supply issues.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                subsystem: "pump",
                failure: "under_performance",
                note: "Intermediate node (root cause depends on linked children in the tree).",
            }),
            tags: JSON.stringify(["pump", "underperforming", "flow", "intermediate"]),
        },

        {
            id: feId("sensor_malfunction"),
            name: "Sensor Malfunction",
            kind: "intermediate",
            description:
                "Sensor provides unreliable or incorrect readings (drift, spikes, dropouts, or stuck values) due to electrical, environmental, or controller issues.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "instrumentation",
                subsystem: "sensors",
                failure: "malfunction",
                note: "Intermediate: may involve Arduino/controller, water contact, wiring, or overload.",
            }),
            tags: JSON.stringify(["sensor", "instrumentation", "fault", "intermediate"]),
        },
        {
            id: feId("gate_or_sensor_malfunction"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Sensor Malfunction occurs if any one of the listed sensor/controller issues occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "sensor_malfunction" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // children
        {
            id: feId("arduino"),
            name: "Arduino",
            kind: "intermediate",
            description:
                "Controller/Arduino subsystem issues affect sensor reading acquisition, processing, or transmission (software, power, or hardware constraints).",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "control_system",
                component: "arduino",
                failure: "controller_issue",
                note: "Intermediate: driven by code issues, storage limits, power issues, or unknown malfunction.",
            }),
            tags: JSON.stringify(["arduino", "controller", "intermediate"]),
        },
        {
            id: feId("water_contact"),
            name: "Water Contact",
            kind: "basic",
            description:
                "Water/moisture contacts sensor wires or electronics, causing short circuits, corrosion, or unstable readings.",
            probability: 0.03,
            severity: "high",
            detection: "low",
            metadata: JSON.stringify({
                domain: "instrumentation",
                failure: "water_contact",
                detection_hint: "Visual inspection for moisture; sudden noisy readings; intermittent shorts.",
            }),
            tags: JSON.stringify(["water", "short", "sensor", "basic"]),
        },
        {
            id: feId("wire_misplacement"),
            name: "Wire Misplacement",
            kind: "basic",
            description:
                "Incorrect wiring (wrong pin, swapped polarity, loose connection) results in incorrect or missing sensor readings.",
            probability: 0.04,
            severity: "medium",
            detection: "high",
            metadata: JSON.stringify({
                domain: "instrumentation",
                failure: "wiring_error",
                detection_hint: "Continuity check; verify pin mapping; compare expected vs observed readings.",
            }),
            tags: JSON.stringify(["wiring", "misplacement", "sensor", "basic"]),
        },
        {
            id: feId("sensor_overload"),
            name: "Sensor Overload",
            kind: "basic",
            description:
                "Sensor operates beyond its rated range (e.g., too high temperature/pressure/flow), causing saturation, clipping, or damage leading to inaccurate readings.",
            probability: 0.02,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "instrumentation",
                failure: "overload",
                detection_hint: "Readings stuck at max/min; sudden step changes; compare with secondary measurement if available.",
            }),
            tags: JSON.stringify(["sensor", "overload", "saturation", "basic"]),
        },

        // Arduino -> gate
        {
            id: feId("gate_or_arduino"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Arduino issues occur if any one of the listed controller-related problems occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "arduino" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // Arduino children
        {
            id: feId("code_issues"),
            name: "Code issues",
            kind: "intermediate",
            description:
                "Software/firmware problems in the Arduino program cause incorrect sensor handling, parsing, scaling, or reporting.",
            probability: null,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "software",
                component: "arduino_firmware",
                failure: "code_issue",
                note: "Intermediate: driven by error in code or wrong program uploaded.",
            }),
            tags: JSON.stringify(["code", "firmware", "arduino", "intermediate"]),
        },
        {
            id: feId("full_storage"),
            name: "Full storage",
            kind: "basic",
            description:
                "Arduino storage/memory/logging space is full, causing logging failures, buffer overflow, or dropped sensor updates.",
            probability: 0.02,
            severity: "medium",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "embedded",
                component: "storage",
                failure: "storage_full",
                detection_hint: "Logs stop updating; write errors; device resets or freezes.",
            }),
            tags: JSON.stringify(["storage", "memory", "arduino", "basic"]),
        },
        {
            id: feId("no_power"),
            name: "No Power",
            kind: "intermediate",
            description:
                "Arduino/sensor subsystem has no power supply, preventing sensor readings from being produced.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "electrical",
                component: "power",
                failure: "no_power",
                note: "Intermediate: driven by battery dies or battery not connected.",
            }),
            tags: JSON.stringify(["power", "battery", "intermediate"]),
        },

        // Code issues -> gate
        {
            id: feId("gate_or_code_issues"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Code issues occur if there is an error in the code or the wrong program was uploaded.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "code_issues" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // Code issues leaves
        {
            id: feId("error_in_the_code"),
            name: "Error in the Code",
            kind: "basic",
            description:
                "Bug or logic mistake in the Arduino code (wrong calibration, wrong units, timing bug, overflow) produces incorrect readings.",
            probability: 0.03,
            severity: "high",
            detection: "medium",
            metadata: JSON.stringify({
                domain: "software",
                component: "arduino_firmware",
                failure: "bug",
                detection_hint: "Unit tests/sanity checks; compare with known reference; review recent code changes.",
            }),
            tags: JSON.stringify(["code", "bug", "arduino", "basic"]),
        },
        {
            id: feId("wrong_program"),
            name: "Wrong program",
            kind: "basic",
            description:
                "Incorrect firmware/program is uploaded or running (wrong sketch/config), causing sensor logic to be incompatible with the setup.",
            probability: 0.02,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "software",
                component: "arduino_firmware",
                failure: "wrong_firmware",
                detection_hint: "Verify build/version; confirm configuration and pin mapping; reflashing resolves issue.",
            }),
            tags: JSON.stringify(["firmware", "wrong-program", "arduino", "basic"]),
        },

        // No Power -> gate
        {
            id: feId("gate_or_no_power"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: No Power occurs if the battery dies or if the battery is not connected.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "no_power" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        // No Power leaves
        {
            id: feId("battery_dies"),
            name: "Battery dies",
            kind: "basic",
            description:
                "Battery is depleted and can no longer provide sufficient voltage/current to power the Arduino/sensors.",
            probability: 0.03,
            severity: "medium",
            detection: "high",
            metadata: JSON.stringify({
                domain: "electrical",
                component: "battery",
                failure: "depleted",
                detection_hint: "Low voltage reading; power LED off; device resets/browns out.",
            }),
            tags: JSON.stringify(["battery", "depleted", "power", "basic"]),
        },
        {
            id: feId("battery_not_connected"),
            name: "Battery not connected",
            kind: "basic",
            description:
                "Battery is disconnected (loose connector, wrong wiring, unplugged), resulting in no power delivered to the Arduino/sensors.",
            probability: 0.02,
            severity: "medium",
            detection: "high",
            metadata: JSON.stringify({
                domain: "electrical",
                component: "battery",
                failure: "disconnected",
                detection_hint: "Immediate no-power state; verify connector seating and wiring.",
            }),
            tags: JSON.stringify(["battery", "disconnected", "power", "basic"]),
        },
    ];

    const events6: NewFailureEventRow[] = [
        {
            id: feId("ultimate_fail"),
            name: "Ultimate Fail",
            kind: "top",
            description:
                "Top event: the system reaches an unacceptable operating state due to temperature or flow being outside normal conditions.",
            probability: null,
            severity: "critical",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                type: "top_event",
                note: "Root of the failure tree (FTA top event).",
            }),
            tags: JSON.stringify(["top", "ultimate", "failure", "fluid-loop"]),
        },
        {
            id: feId("gate_or_ultimate_fail"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Ultimate Fail occurs if either Temperature Out of Normal Conditions or Flow out of normal conditions occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "ultimate_fail" }),
            tags: JSON.stringify(["gate", "or"]),
        },

        {
            id: feId("temp_out_of_normal_conditions"),
            name: "Temperature Out of Normal Conditions",
            kind: "intermediate",
            description:
                "Temperature deviates from the normal operating range (too high or too low), indicating abnormal thermal control or cooling/heating issues.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                signal: "temperature",
                threshold: "outside_normal",
                note: "Intermediate: expands into above-normal and under-normal branches.",
            }),
            tags: JSON.stringify(["temperature", "abnormal", "intermediate"]),
        },
        {
            id: feId("gate_or_temp_out_of_normal_conditions"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Temperature Out of Normal Conditions occurs if Temperature Above Normal Conditions or Temperature Under Normal Conditions occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "OR",
                parent: "temp_out_of_normal_conditions",
            }),
            tags: JSON.stringify(["gate", "or"]),
        },

        {
            id: feId("flow_out_of_normal_conditions"),
            name: "Flow out of normal conditions",
            kind: "intermediate",
            description:
                "Measured flow deviates from the normal operating range (too high or too low), indicating abnormal pump operation, restriction, leakage, or sensor issues.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                signal: "flow",
                threshold: "outside_normal",
                note: "Intermediate: expands into high-flow and low-flow branches.",
            }),
            tags: JSON.stringify(["flow", "abnormal", "intermediate"]),
        },
        {
            id: feId("gate_or_flow_out_of_normal_conditions"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Flow out of normal conditions occurs if High Flow or Low Flow occurs.",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({
                gate: "OR",
                parent: "flow_out_of_normal_conditions",
            }),
            tags: JSON.stringify(["gate", "or"]),
        },

        {
            id: feId("low_flow"),
            name: "Low Flow",
            kind: "intermediate",
            description:
                "Flow rate drops below the defined normal operating range; commonly caused by blockages, leaks, pump issues, or sensor malfunction.",
            probability: null,
            severity: "high",
            detection: "high",
            metadata: JSON.stringify({
                domain: "fluid_loop",
                signal: "flow",
                threshold: "below_normal",
                note: "Intermediate: expands into blockage/leak/pump/sensor branches.",
            }),
            tags: JSON.stringify(["flow", "below-normal", "abnormal", "intermediate"]),
        },
        {
            id: feId("gate_or_low_flow"),
            name: "OR Gate",
            kind: "gate_or",
            description:
                "OR logic: Low Flow occurs if any one of its child causes occurs (blockages, leaks, pump issues, or sensor malfunction).",
            probability: null,
            severity: null,
            detection: null,
            metadata: JSON.stringify({ gate: "OR", parent: "low_flow" }),
            tags: JSON.stringify(["gate", "or"]),
        },
    ];

    await db.insert(failureEvents).values(events1);
    await db.insert(failureEvents).values(events2);
    await db.insert(failureEvents).values(events3);
    await db.insert(failureEvents).values(events4);
    await db.insert(failureEvents).values(events5);
    await db.insert(failureEvents).values(events6);

    // ---- Links (clip #1) ----
    const links1: NewFailureEventLinkRow[] = [
        // Temperature Above Normal Conditions -> gate
        {
            id: felId("temp_above_normal_conditions", "gate_or_temp_above_normal_conditions"),
            fromEventId: feId("temp_above_normal_conditions"),
            toEventId: feId("gate_or_temp_above_normal_conditions"),
            linkType: "default",
            metadata: null,
        },

        // main gate -> 4 children
        {
            id: felId("gate_or_temp_above_normal_conditions", "cooling_reservoir_blocked"),
            fromEventId: feId("gate_or_temp_above_normal_conditions"),
            toEventId: feId("cooling_reservoir_blocked"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_temp_above_normal_conditions", "cooling_reservoir_leakage"),
            fromEventId: feId("gate_or_temp_above_normal_conditions"),
            toEventId: feId("cooling_reservoir_leakage"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_temp_above_normal_conditions", "recirculation_of_alternate_route"),
            fromEventId: feId("gate_or_temp_above_normal_conditions"),
            toEventId: feId("recirculation_of_alternate_route"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_temp_above_normal_conditions", "heater_kept_on"),
            fromEventId: feId("gate_or_temp_above_normal_conditions"),
            toEventId: feId("heater_kept_on"),
            linkType: "default",
            metadata: null,
        },

        // Cooling Reservoir Blocked -> its gate
        {
            id: felId("cooling_reservoir_blocked", "gate_or_cooling_reservoir_blocked"),
            fromEventId: feId("cooling_reservoir_blocked"),
            toEventId: feId("gate_or_cooling_reservoir_blocked"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> leaves
        {
            id: felId("gate_or_cooling_reservoir_blocked", "valves_close"),
            fromEventId: feId("gate_or_cooling_reservoir_blocked"),
            toEventId: feId("valves_close"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_cooling_reservoir_blocked", "contamination"),
            fromEventId: feId("gate_or_cooling_reservoir_blocked"),
            toEventId: feId("contamination"),
            linkType: "default",
            metadata: null,
        },

        // Recirculation of Alternate Route -> its gate
        {
            id: felId("recirculation_of_alternate_route", "gate_and_recirculation_of_alternate_route"),
            fromEventId: feId("recirculation_of_alternate_route"),
            toEventId: feId("gate_and_recirculation_of_alternate_route"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> leaves
        {
            id: felId("gate_and_recirculation_of_alternate_route", "bucket_1_leak"),
            fromEventId: feId("gate_and_recirculation_of_alternate_route"),
            toEventId: feId("bucket_1_leak"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_and_recirculation_of_alternate_route", "bucket_2_leak"),
            fromEventId: feId("gate_and_recirculation_of_alternate_route"),
            toEventId: feId("bucket_2_leak"),
            linkType: "default",
            metadata: null,
        },
    ];

    const links2: NewFailureEventLinkRow[] = [
        // Temperature Under Normal Conditions -> gate
        {
            id: felId("temp_under_normal_conditions", "gate_or_temp_under_normal_conditions"),
            fromEventId: feId("temp_under_normal_conditions"),
            toEventId: feId("gate_or_temp_under_normal_conditions"),
            linkType: "default",
            metadata: null,
        },

        // main gate -> 2 children
        {
            id: felId("gate_or_temp_under_normal_conditions", "excessive_cooling_duration"),
            fromEventId: feId("gate_or_temp_under_normal_conditions"),
            toEventId: feId("excessive_cooling_duration"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_temp_under_normal_conditions", "heater_kept_off"),
            fromEventId: feId("gate_or_temp_under_normal_conditions"),
            toEventId: feId("heater_kept_off"),
            linkType: "default",
            metadata: null,
        },

        // Excessive Cooling Duration -> its gate
        {
            id: felId("excessive_cooling_duration", "gate_or_excessive_cooling_duration"),
            fromEventId: feId("excessive_cooling_duration"),
            toEventId: feId("gate_or_excessive_cooling_duration"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> leaves
        {
            id: felId("gate_or_excessive_cooling_duration", "operator_error"),
            fromEventId: feId("gate_or_excessive_cooling_duration"),
            toEventId: feId("operator_error"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_excessive_cooling_duration", "leakage_in_hot_reservoir"),
            fromEventId: feId("gate_or_excessive_cooling_duration"),
            toEventId: feId("leakage_in_hot_reservoir"),
            linkType: "default",
            metadata: null,
        },

        // Heater kept off -> its gate
        {
            id: felId("heater_kept_off", "gate_or_heater_kept_off"),
            fromEventId: feId("heater_kept_off"),
            toEventId: feId("gate_or_heater_kept_off"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> leaves
        {
            id: felId("gate_or_heater_kept_off", "operator_error"),
            fromEventId: feId("gate_or_heater_kept_off"),
            toEventId: feId("operator_error"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_heater_kept_off", "heater_malfunction"),
            fromEventId: feId("gate_or_heater_kept_off"),
            toEventId: feId("heater_malfunction"),
            linkType: "default",
            metadata: null,
        },
    ];

    // ---- Links (clip #3) ----
    const links3: NewFailureEventLinkRow[] = [
        // High Flow -> gate
        {
            id: felId("high_flow", "gate_or_high_flow"),
            fromEventId: feId("high_flow"),
            toEventId: feId("gate_or_high_flow"),
            linkType: "default",
            metadata: null,
        },

        // gate -> (3) main branches
        {
            id: felId("gate_or_high_flow", "pump_operating_above_normal_conditions"),
            fromEventId: feId("gate_or_high_flow"),
            toEventId: feId("pump_operating_above_normal_conditions"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_high_flow", "blockage_before_gp"),
            fromEventId: feId("gate_or_high_flow"),
            toEventId: feId("blockage_before_gp"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_high_flow", "blockage_after_gp"),
            fromEventId: feId("gate_or_high_flow"),
            toEventId: feId("blockage_after_gp"),
            linkType: "default",
            metadata: null,
        },

        // Pump Operating Above Normal Conditions -> its gate
        {
            id: felId("pump_operating_above_normal_conditions", "gate_or_pump_operating_above_normal_conditions"),
            fromEventId: feId("pump_operating_above_normal_conditions"),
            toEventId: feId("gate_or_pump_operating_above_normal_conditions"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> Operator Error (shared) + System Error
        {
            id: felId("gate_or_pump_operating_above_normal_conditions", "operator_error"),
            fromEventId: feId("gate_or_pump_operating_above_normal_conditions"),
            toEventId: feId("operator_error"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_pump_operating_above_normal_conditions", "system_error"),
            fromEventId: feId("gate_or_pump_operating_above_normal_conditions"),
            toEventId: feId("system_error"),
            linkType: "default",
            metadata: null,
        },

        // Blockage Before GP -> its gate
        {
            id: felId("blockage_before_gp", "gate_and_blockage_before_gp"),
            fromEventId: feId("blockage_before_gp"),
            toEventId: feId("gate_and_blockage_before_gp"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> original route + alternative route
        {
            id: felId("gate_and_blockage_before_gp", "blockage_in_original_route"),
            fromEventId: feId("gate_and_blockage_before_gp"),
            toEventId: feId("blockage_in_original_route"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_and_blockage_before_gp", "blockage_in_alternative_route"),
            fromEventId: feId("gate_and_blockage_before_gp"),
            toEventId: feId("blockage_in_alternative_route"),
            linkType: "default",
            metadata: null,
        },

        // Blockage in original route -> its gate
        {
            id: felId("blockage_in_original_route", "gate_or_blockage_in_original_route"),
            fromEventId: feId("blockage_in_original_route"),
            toEventId: feId("gate_or_blockage_in_original_route"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> Valves closed (shared) + Contamination (shared)
        {
            id: felId("gate_or_blockage_in_original_route", "valves_close"),
            fromEventId: feId("gate_or_blockage_in_original_route"),
            toEventId: feId("valves_close"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_blockage_in_original_route", "contamination"),
            fromEventId: feId("gate_or_blockage_in_original_route"),
            toEventId: feId("contamination"),
            linkType: "default",
            metadata: null,
        },

        // Blockage in Alternative Route -> its gate
        {
            id: felId("blockage_in_alternative_route", "gate_or_blockage_in_alternative_route"),
            fromEventId: feId("blockage_in_alternative_route"),
            toEventId: feId("gate_or_blockage_in_alternative_route"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> Operator error (shared) + Valves closed (shared) + Contamination (shared)
        {
            id: felId("gate_or_blockage_in_alternative_route", "operator_error"),
            fromEventId: feId("gate_or_blockage_in_alternative_route"),
            toEventId: feId("operator_error"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_blockage_in_alternative_route", "valves_close"),
            fromEventId: feId("gate_or_blockage_in_alternative_route"),
            toEventId: feId("valves_close"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_blockage_in_alternative_route", "contamination"),
            fromEventId: feId("gate_or_blockage_in_alternative_route"),
            toEventId: feId("contamination"),
            linkType: "default",
            metadata: null,
        },

        // Blockage After GP -> its gate
        {
            id: felId("blockage_after_gp", "gate_or_blockage_after_gp"),
            fromEventId: feId("blockage_after_gp"),
            toEventId: feId("gate_or_blockage_after_gp"),
            linkType: "default",
            metadata: null,
        },

        // its gate -> Contamination (shared) + valve-subgate
        {
            id: felId("gate_or_blockage_after_gp", "contamination"),
            fromEventId: feId("gate_or_blockage_after_gp"),
            toEventId: feId("contamination"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_blockage_after_gp", "gate_and_blockage_after_gp_valves"),
            fromEventId: feId("gate_or_blockage_after_gp"),
            toEventId: feId("gate_and_blockage_after_gp_valves"),
            linkType: "default",
            metadata: null,
        },

        // valve-subgate -> valve1/2/3
        {
            id: felId("gate_and_blockage_after_gp_valves", "valve_1_closed"),
            fromEventId: feId("gate_and_blockage_after_gp_valves"),
            toEventId: feId("valve_1_closed"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_and_blockage_after_gp_valves", "valve_2_closed"),
            fromEventId: feId("gate_and_blockage_after_gp_valves"),
            toEventId: feId("valve_2_closed"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_and_blockage_after_gp_valves", "valve_3_closed"),
            fromEventId: feId("gate_and_blockage_after_gp_valves"),
            toEventId: feId("valve_3_closed"),
            linkType: "default",
            metadata: null,
        },
    ];

    // ---- Links (clip #4) ----
    const links4: NewFailureEventLinkRow[] = [
        // Leaks -> gate
        {
            id: felId("leaks", "gate_or_leaks"),
            fromEventId: feId("leaks"),
            toEventId: feId("gate_or_leaks"),
            linkType: "default",
            metadata: null,
        },
        // gate -> Pipe Crack, Loose Fittings
        {
            id: felId("gate_or_leaks", "pipe_crack"),
            fromEventId: feId("gate_or_leaks"),
            toEventId: feId("pipe_crack"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_leaks", "loose_fittings"),
            fromEventId: feId("gate_or_leaks"),
            toEventId: feId("loose_fittings"),
            linkType: "default",
            metadata: null,
        },

        // Broken pump -> gate
        {
            id: felId("broken_pump", "gate_or_broken_pump"),
            fromEventId: feId("broken_pump"),
            toEventId: feId("gate_or_broken_pump"),
            linkType: "default",
            metadata: null,
        },
        // broken pump gate -> children (incl. shared contamination + cavitation)
        {
            id: felId("gate_or_broken_pump", "contamination"),
            fromEventId: feId("gate_or_broken_pump"),
            toEventId: feId("contamination"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_broken_pump", "wrong_fluid"),
            fromEventId: feId("gate_or_broken_pump"),
            toEventId: feId("wrong_fluid"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_broken_pump", "electrical_problems"),
            fromEventId: feId("gate_or_broken_pump"),
            toEventId: feId("electrical_problems"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_broken_pump", "pump_seal_leak"),
            fromEventId: feId("gate_or_broken_pump"),
            toEventId: feId("pump_seal_leak"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_broken_pump", "unknown_malfunction"),
            fromEventId: feId("gate_or_broken_pump"),
            toEventId: feId("unknown_malfunction"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_broken_pump", "cavitation"),
            fromEventId: feId("gate_or_broken_pump"),
            toEventId: feId("cavitation"),
            linkType: "default",
            metadata: null,
        },

        // Electrical Problems -> gate
        {
            id: felId("electrical_problems", "gate_or_electrical_problems"),
            fromEventId: feId("electrical_problems"),
            toEventId: feId("gate_or_electrical_problems"),
            linkType: "default",
            metadata: null,
        },
        // electrical gate -> Operator Error (shared), Power Outage
        {
            id: felId("gate_or_electrical_problems", "operator_error"),
            fromEventId: feId("gate_or_electrical_problems"),
            toEventId: feId("operator_error"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_electrical_problems", "power_outage"),
            fromEventId: feId("gate_or_electrical_problems"),
            toEventId: feId("power_outage"),
            linkType: "default",
            metadata: null,
        },

        // Cavitation -> gate
        {
            id: felId("cavitation", "gate_or_cavitation"),
            fromEventId: feId("cavitation"),
            toEventId: feId("gate_or_cavitation"),
            linkType: "default",
            metadata: null,
        },
        // cavitation gate -> children (operator error shared)
        {
            id: felId("gate_or_cavitation", "operator_error"),
            fromEventId: feId("gate_or_cavitation"),
            toEventId: feId("operator_error"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_cavitation", "blockage_before_pump"),
            fromEventId: feId("gate_or_cavitation"),
            toEventId: feId("blockage_before_pump"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_cavitation", "bucket_leaks"),
            fromEventId: feId("gate_or_cavitation"),
            toEventId: feId("bucket_leaks"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_cavitation", "alt_route_circulation_above_designed_time"),
            fromEventId: feId("gate_or_cavitation"),
            toEventId: feId("alt_route_circulation_above_designed_time"),
            linkType: "default",
            metadata: null,
        },

        // Alternative Route Circulation Above Designed Time -> gate
        {
            id: felId(
                "alt_route_circulation_above_designed_time",
                "gate_and_alt_route_circulation_above_designed_time",
            ),
            fromEventId: feId("alt_route_circulation_above_designed_time"),
            toEventId: feId("gate_and_alt_route_circulation_above_designed_time"),
            linkType: "default",
            metadata: null,
        },
        // its gate -> bucket 1/2 leak (shared)
        {
            id: felId("gate_and_alt_route_circulation_above_designed_time", "bucket_1_leak"),
            fromEventId: feId("gate_and_alt_route_circulation_above_designed_time"),
            toEventId: feId("bucket_1_leak"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_and_alt_route_circulation_above_designed_time", "bucket_2_leak"),
            fromEventId: feId("gate_and_alt_route_circulation_above_designed_time"),
            toEventId: feId("bucket_2_leak"),
            linkType: "default",
            metadata: null,
        },
    ];

    // ---- Links (clip #5) ----
    const links5: NewFailureEventLinkRow[] = [
        // Sensor Malfunction -> gate
        {
            id: felId("sensor_malfunction", "gate_or_sensor_malfunction"),
            fromEventId: feId("sensor_malfunction"),
            toEventId: feId("gate_or_sensor_malfunction"),
            linkType: "default",
            metadata: null,
        },

        // gate -> children
        {
            id: felId("gate_or_sensor_malfunction", "arduino"),
            fromEventId: feId("gate_or_sensor_malfunction"),
            toEventId: feId("arduino"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_sensor_malfunction", "water_contact"),
            fromEventId: feId("gate_or_sensor_malfunction"),
            toEventId: feId("water_contact"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_sensor_malfunction", "wire_misplacement"),
            fromEventId: feId("gate_or_sensor_malfunction"),
            toEventId: feId("wire_misplacement"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_sensor_malfunction", "sensor_overload"),
            fromEventId: feId("gate_or_sensor_malfunction"),
            toEventId: feId("sensor_overload"),
            linkType: "default",
            metadata: null,
        },

        // Arduino -> gate
        {
            id: felId("arduino", "gate_or_arduino"),
            fromEventId: feId("arduino"),
            toEventId: feId("gate_or_arduino"),
            linkType: "default",
            metadata: null,
        },

        // gate -> Code issues, Full storage, No Power, Unknown malfunction (shared)
        {
            id: felId("gate_or_arduino", "code_issues"),
            fromEventId: feId("gate_or_arduino"),
            toEventId: feId("code_issues"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_arduino", "full_storage"),
            fromEventId: feId("gate_or_arduino"),
            toEventId: feId("full_storage"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_arduino", "no_power"),
            fromEventId: feId("gate_or_arduino"),
            toEventId: feId("no_power"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_arduino", "unknown_malfunction"),
            fromEventId: feId("gate_or_arduino"),
            toEventId: feId("unknown_malfunction"), // reused
            linkType: "default",
            metadata: null,
        },

        // Code issues -> gate
        {
            id: felId("code_issues", "gate_or_code_issues"),
            fromEventId: feId("code_issues"),
            toEventId: feId("gate_or_code_issues"),
            linkType: "default",
            metadata: null,
        },

        // gate -> Error in the Code, Wrong program
        {
            id: felId("gate_or_code_issues", "error_in_the_code"),
            fromEventId: feId("gate_or_code_issues"),
            toEventId: feId("error_in_the_code"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_code_issues", "wrong_program"),
            fromEventId: feId("gate_or_code_issues"),
            toEventId: feId("wrong_program"),
            linkType: "default",
            metadata: null,
        },

        // No Power -> gate
        {
            id: felId("no_power", "gate_or_no_power"),
            fromEventId: feId("no_power"),
            toEventId: feId("gate_or_no_power"),
            linkType: "default",
            metadata: null,
        },

        // gate -> Battery dies, Battery not connected
        {
            id: felId("gate_or_no_power", "battery_dies"),
            fromEventId: feId("gate_or_no_power"),
            toEventId: feId("battery_dies"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_no_power", "battery_not_connected"),
            fromEventId: feId("gate_or_no_power"),
            toEventId: feId("battery_not_connected"),
            linkType: "default",
            metadata: null,
        },
    ];

    const links6: NewFailureEventLinkRow[] = [
        // Ultimate Fail -> gate
        {
            id: felId("ultimate_fail", "gate_or_ultimate_fail"),
            fromEventId: feId("ultimate_fail"),
            toEventId: feId("gate_or_ultimate_fail"),
            linkType: "default",
            metadata: null,
        },

        // gate -> Temperature Out + Flow out
        {
            id: felId("gate_or_ultimate_fail", "temp_out_of_normal_conditions"),
            fromEventId: feId("gate_or_ultimate_fail"),
            toEventId: feId("temp_out_of_normal_conditions"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_ultimate_fail", "flow_out_of_normal_conditions"),
            fromEventId: feId("gate_or_ultimate_fail"),
            toEventId: feId("flow_out_of_normal_conditions"),
            linkType: "default",
            metadata: null,
        },

        // Temperature Out of Normal Conditions -> gate
        {
            id: felId("temp_out_of_normal_conditions", "gate_or_temp_out_of_normal_conditions"),
            fromEventId: feId("temp_out_of_normal_conditions"),
            toEventId: feId("gate_or_temp_out_of_normal_conditions"),
            linkType: "default",
            metadata: null,
        },

        // gate -> Above / Under (reused)
        {
            id: felId("gate_or_temp_out_of_normal_conditions", "temp_above_normal_conditions"),
            fromEventId: feId("gate_or_temp_out_of_normal_conditions"),
            toEventId: feId("temp_above_normal_conditions"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_temp_out_of_normal_conditions", "temp_under_normal_conditions"),
            fromEventId: feId("gate_or_temp_out_of_normal_conditions"),
            toEventId: feId("temp_under_normal_conditions"),
            linkType: "default",
            metadata: null,
        },

        // Flow out of normal conditions -> gate
        {
            id: felId("flow_out_of_normal_conditions", "gate_or_flow_out_of_normal_conditions"),
            fromEventId: feId("flow_out_of_normal_conditions"),
            toEventId: feId("gate_or_flow_out_of_normal_conditions"),
            linkType: "default",
            metadata: null,
        },

        // gate -> High Flow (reused) + Low Flow (new)
        {
            id: felId("gate_or_flow_out_of_normal_conditions", "high_flow"),
            fromEventId: feId("gate_or_flow_out_of_normal_conditions"),
            toEventId: feId("high_flow"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_flow_out_of_normal_conditions", "low_flow"),
            fromEventId: feId("gate_or_flow_out_of_normal_conditions"),
            toEventId: feId("low_flow"),
            linkType: "default",
            metadata: null,
        },

        // Low Flow -> gate
        {
            id: felId("low_flow", "gate_or_low_flow"),
            fromEventId: feId("low_flow"),
            toEventId: feId("gate_or_low_flow"),
            linkType: "default",
            metadata: null,
        },

        // Low Flow gate -> children (all reused from earlier clips)
        {
            id: felId("gate_or_low_flow", "blockage_before_gp"),
            fromEventId: feId("gate_or_low_flow"),
            toEventId: feId("blockage_before_gp"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_low_flow", "blockage_after_gp"),
            fromEventId: feId("gate_or_low_flow"),
            toEventId: feId("blockage_after_gp"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_low_flow", "leaks"),
            fromEventId: feId("gate_or_low_flow"),
            toEventId: feId("leaks"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_low_flow", "broken_pump"),
            fromEventId: feId("gate_or_low_flow"),
            toEventId: feId("broken_pump"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_low_flow", "pump_under_performing"),
            fromEventId: feId("gate_or_low_flow"),
            toEventId: feId("pump_under_performing"),
            linkType: "default",
            metadata: null,
        },
        {
            id: felId("gate_or_low_flow", "sensor_malfunction"),
            fromEventId: feId("gate_or_low_flow"),
            toEventId: feId("sensor_malfunction"),
            linkType: "default",
            metadata: null,
        },
    ];

    await db.insert(failureEventLinks).values(links1);
    await db.insert(failureEventLinks).values(links2);
    await db.insert(failureEventLinks).values(links3);
    await db.insert(failureEventLinks).values(links4);
    await db.insert(failureEventLinks).values(links5);
    await db.insert(failureEventLinks).values(links6);
}

async function main() {
    await seed_users()
    await seed_parts()
    await seed_part_links()
    await seed_sensor_readings()
    await seed_notifications()
    await seed_chats()
    await seed_shifts_notes()
    await seed_failure_tree()
}

main()
    .then(() => console.log("Seed done"))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
