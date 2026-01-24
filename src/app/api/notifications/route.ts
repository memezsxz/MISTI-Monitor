import {NextResponse} from "next/server";

export const runtime = "nodejs";

import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import {desc, sql} from "drizzle-orm";

export async function GET() {
    try {
        const rows = await db
            .select()
            .from(notifications)
            .orderBy(
                sql`case ${notifications.level} when 'high' then 1 when 'medium' then 2 when 'low' then 3 else 4 end`,
                desc(notifications.createdAt),
            );

        return NextResponse.json(rows);
    } catch (err) {
        console.error("GET /api/notifications failed:", err);
        return NextResponse.json(
            { error: String(err) },
            { status: 500 }
        );
    }
}
