import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { loadPumpPlanSnapshot } from "@/lib/pumpPlanSnapshot";

export async function GET() {
    try {
        const snapshot = await loadPumpPlanSnapshot();
        return NextResponse.json(snapshot.tooltips);
    } catch (err) {
        console.error("GET /api/pump-plan failed:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
