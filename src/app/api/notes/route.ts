import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "@/db/db";
import { turnoverNotes } from "@/db/schema/turnover_notes";
import { shifts } from "@/db/schema/shifts";

function parsePagination(url: URL) {
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(
        50,
        Math.max(1, Number(url.searchParams.get("pageSize") ?? "10") || 10)
    );
    const offset = (page - 1) * pageSize;
    return { page, pageSize, offset };
}

// GET /api/notes?shiftId=123&page=1&pageSize=10
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const { page, pageSize, offset } = parsePagination(url);

        const shiftIdParam = url.searchParams.get("shiftId");
        const shiftId = shiftIdParam ? Number(shiftIdParam) : null;
        if (shiftIdParam && (!Number.isFinite(shiftId) || shiftId! <= 0)) {
            return NextResponse.json({ error: "Invalid shiftId" }, { status: 400 });
        }

        const whereClause = shiftId ? eq(turnoverNotes.shiftId, shiftId) : undefined;

        const totalRow = await db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(turnoverNotes)
            .where(whereClause);

        const total = totalRow[0]?.count ?? 0;

        const items = await db
            .select()
            .from(turnoverNotes)
            .where(whereClause)
            .orderBy(desc(turnoverNotes.createdAt))
            .limit(pageSize)
            .offset(offset);

        return NextResponse.json({
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items,
        });
    } catch (err) {
        console.error("GET /api/notes failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/notes
// body: { shiftId: number, text: string }
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        const shiftId = Number(body?.shiftId);
        const text = String(body?.text ?? "").trim();

        if (!Number.isFinite(shiftId) || shiftId <= 0) {
            return NextResponse.json({ error: "shiftId is required" }, { status: 400 });
        }
        if (!text) {
            return NextResponse.json({ error: "text is required" }, { status: 400 });
        }

        // Optional rule: only allow creating notes on an ACTIVE shift
        const shift = await db
            .select({ id: shifts.id, endedAt: shifts.endedAt })
            .from(shifts)
            .where(eq(shifts.id, shiftId))
            .limit(1);

        if (!shift[0]) {
            return NextResponse.json({ error: "Shift not found" }, { status: 404 });
        }
        if (shift[0].endedAt) {
            return NextResponse.json({ error: "Shift is closed (read-only)" }, { status: 403 });
        }

        const inserted = await db
            .insert(turnoverNotes)
            .values({ shiftId, text })
            .returning();

        return NextResponse.json(inserted[0], { status: 201 });
    } catch (err) {
        console.error("POST /api/notes failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
