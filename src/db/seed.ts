import {db} from "./db";
import {aiChat, NewAiChatRow, NewUser, notifications, users} from "./schema";
import {inArray} from "drizzle-orm";
import {turnoverNotes} from "@/db/schema/turnover_notes";
import {NewShift, shifts} from "@/db/schema/shifts";

async function main() {

    await db.insert(users).values([
        {name: "maryam.ali", password: "Ma123!"},
        {name: "manal.albalushi", password: "Ma123!"},
    ] as NewUser[]);

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

    // notes & shifts
    const seededUsers = await db
        .select({ id: users.id, name: users.name })
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
        .returning({ id: shifts.id, userId: shifts.userId });

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

main()
    .then(() => console.log("Seed done"))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
