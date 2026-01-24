import {db} from "./db";
import {aiChat, NewAiChatRow, NewPart, NewUser, notifications, parts, users} from "./schema";
import {inArray} from "drizzle-orm";
import {turnoverNotes} from "@/db/schema/turnover_notes";
import {NewShift, shifts} from "@/db/schema/shifts";
import {createHash} from "node:crypto";

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
            category: "low",
            title: "System initialized",
            message: "Fluid loop monitoring started. Sensors online: flow, temperature."
        },
        {
            category: "low",
            title: "Baseline mode active",
            message: "Collecting baseline readings for normal operation profile."
        },
        {
            category: "low",
            title: "Calibration reminder",
            message: "Verify flow sensor zero-offset and temperature probe placement."
        },
        {
            category: "low",
            title: "Maintenance schedule",
            message: "Next routine check: inspect hoses, clamps, and bucket levels."
        },
        {
            category: "low",
            title: "Logging enabled",
            message: "Event logging is active. Storing readings at the configured interval."
        },

        {
            category: "medium",
            title: "Temperature drift detected",
            message: "Hot bucket temperature trending below target range. Check heater and insulation."
        },
        {
            category: "medium",
            title: "Flow instability",
            message: "Flow readings show higher variance than baseline. Check pump speed and inlet conditions."
        },
        {
            category: "medium",
            title: "Possible valve restriction",
            message: "Flow decreased gradually while pump speed stayed constant. Inspect valve position and blockage."
        },

        {
            category: "high",
            title: "Critical flow drop",
            message: "Flow rate fell sharply below safe threshold. Possible blockage, pump issue, or empty supply."
        },
        {
            category: "high",
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
                startedAt: today7am.toISOString(),
                endedAt: null, // active shift
                note: null,
            },
            {
                userId: manalId,
                startedAt: yesterday7pm.toISOString(),
                endedAt: yesterday1159.toISOString(), // closed shift
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


async function seed_parts() {
    await db.insert(parts).values(
        [
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
        ] as NewPart[]);

}

async function main() {
    await seed_users()
    await seed_notifications()
    await seed_chats()
    await seed_shifts_notes()
    await seed_parts()
}

main()
    .then(() => console.log("Seed done"))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
