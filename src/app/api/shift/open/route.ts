import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db/db";
import { shifts } from "@/db/schema/shifts";

// POST /api/shift/open
// body: { userId: number }
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        const userId = Number(body?.userId);

        if (!Number.isFinite(userId) || userId <= 0) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // if already active, return it (don’t open a second shift)
        const existing = await db
            .select()
            .from(shifts)
            .where(and(eq(shifts.userId, userId), isNull(shifts.endedAt)))
            .orderBy(desc(shifts.startedAt))
            .limit(1);

        if (existing[0]) {
            return NextResponse.json(existing[0]);
        }

        const inserted = await db.insert(shifts).values({ userId }).returning();
        return NextResponse.json(inserted[0], { status: 201 });
    } catch (err) {
        console.error("POST /api/shift/open failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
