import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "@/db/db";
import { shifts } from "@/db/schema/shifts";
import {users} from "@/db/schema";

function parsePagination(url: URL) {
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(
        50,
        Math.max(1, Number(url.searchParams.get("pageSize") ?? "10") || 10)
    );
    const offset = (page - 1) * pageSize;
    return { page, pageSize, offset };
}

// GET /api/shift?userId=1&page=1&pageSize=10&activeOnly=1
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const { page, pageSize, offset } = parsePagination(url);

        const userIdParam = url.searchParams.get("userId");
        const userId = userIdParam ? Number(userIdParam) : null;
        if (userIdParam && (!Number.isFinite(userId) || userId! <= 0)) {
            return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
        }

        const activeOnly = url.searchParams.get("activeOnly") === "1";

        const whereParts = [];
        if (userId) whereParts.push(eq(shifts.userId, userId));
        if (activeOnly) whereParts.push(isNull(shifts.endedAt));

        const whereClause =
            whereParts.length === 0 ? undefined : and(...whereParts);

        const totalRow = await db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(shifts)
            .where(whereClause);

        const total = totalRow[0]?.count ?? 0;

        // const items = await db
        //     .select()
        //     .from(shifts)
        //     .where(whereClause)
        //     .orderBy(desc(shifts.startedAt))
        //     .limit(pageSize)
        //     .offset(offset);

        const items = await db
            .select({
                id: shifts.id,
                userId: shifts.userId,
                startedAt: shifts.startedAt,
                endedAt: shifts.endedAt,
                note: shifts.note,
                userName: users.name,
            })
            .from(shifts)
            .where(whereClause)
            .leftJoin(users, eq(users.id, shifts.userId))
            .orderBy(desc(shifts.startedAt))
            .limit(pageSize)
            .offset(offset)

        return NextResponse.json({
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items,
        });
    } catch (err) {
        console.error("GET /api/shift failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
