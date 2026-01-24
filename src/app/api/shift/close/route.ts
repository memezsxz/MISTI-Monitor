import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "@/db/db";
import { shifts } from "@/db/schema/shifts";

// POST /api/shift/close
// body: { userId: number }
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        const userId = Number(body?.userId);

        if (!Number.isFinite(userId) || userId <= 0) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const active = await db
            .select()
            .from(shifts)
            .where(and(eq(shifts.userId, userId), isNull(shifts.endedAt)))
            .orderBy(desc(shifts.startedAt))
            .limit(1);

        if (!active[0]) {
            return NextResponse.json({ error: "No active shift to close" }, { status: 404 });
        }

        const updated = await db
            .update(shifts)
            .set({ endedAt: sql`(datetime('now'))` })
            .where(eq(shifts.id, active[0].id))
            .returning();

        return NextResponse.json(updated[0]);
    } catch (err) {
        console.error("POST /api/shift/close failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
