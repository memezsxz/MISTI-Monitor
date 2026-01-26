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
            message: "Flow rate fell sharply below safe threshold. Possible blockage, pump issue, or empty supply."
        },
        {
            level: "high",
            title: "Overtemperature risk",
            message: "Temperature exceeded the configured safe limit. Stop system and verify heating/control components."
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
        sensor_1: 2.3,
        sensor_2: 2.1,
        sensor_3: 2.2,
        sensor_4: 2.0,
        sensor_5: 45.0,
        sensor_6: 46.2,
        sensor_7: 44.6,
        sensor_8: 43.9,
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

async function main() {
    await seed_users()
    await seed_parts()
    await seed_part_links()
    await seed_sensor_readings()
    await seed_notifications()
    await seed_chats()
    await seed_shifts_notes()
}

main()
    .then(() => console.log("Seed done"))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
