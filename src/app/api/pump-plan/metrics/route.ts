import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { loadPumpPlanSnapshot } from "@/lib/pumpPlanSnapshot";

export async function GET() {
    try {
        const snapshot = await loadPumpPlanSnapshot();
        return NextResponse.json(snapshot.metrics);
    } catch (err) {
        console.error("GET /api/pump-plan/metrics failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
